<?php

namespace App\Services\Api\V1\Collaboration;

use App\Http\Resources\Api\V1\Collaboration\ForumDetailResource;
use App\Http\Resources\Api\V1\Collaboration\ForumResource;
use App\Models\Collaboration\Forum;
use App\Models\Collaboration\ForumPeriod;
use App\Models\Collaboration\ForumParticipant;
use App\Models\User;
use App\Services\Api\V1\Security\AuditLogService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class ForumService
{
    public function __construct(private readonly AuditLogService $audit) {}

    public function index(Request $request, ?string $periodId = null): JsonResponse
    {
        $search = $request->input('search') ?: $request->input('q') ?: $request->input('keyword');
        $effectivePeriodId = $periodId ?: ($request->input('forum_period_id') ?: $request->input('period_id'));
        $query = Forum::query()
            ->with(['period', 'responsibleUser', 'participants.user', 'participants.addedBy'])
            ->withCount(['participants', 'topics', 'attachments'])
            ->when($effectivePeriodId, fn ($q) => $q->where('forum_period_id', $effectivePeriodId))
            ->when($request->input('visibility'), fn ($q, $v) => $q->where('visibility', $v))
            ->when($request->has('is_archived'), fn ($q) => $q->where('is_archived', $request->boolean('is_archived')))
            ->when($request->boolean('mine'), fn ($q) => $q->whereHas('participants', fn ($p) => $p->where('user_id', $request->user()->id)->whereNull('removed_at')))
            ->when($search, fn ($q) => $q->where(fn ($i) => $i->where('name', 'ilike', "%{$search}%")->orWhere('description', 'ilike', "%{$search}%")));

        $paginator = $query->latest()->paginate((int) $request->integer('per_page', 10));
        $items = collect($paginator->items())->map(fn ($forum) => (new ForumResource($forum))->resolve($request))->values()->all();
        $pagination = $this->pagination($paginator);

        return response()->json([
            'success' => true,
            'message' => 'Forums retrieved successfully',
            'data' => ['forums' => $items, 'rooms' => $items, 'items' => $items],
            'forums' => $items,
            'rooms' => $items,
            'items' => $items,
            'meta' => $pagination,
            'pagination' => $pagination,
        ]);
    }

    public function store(string $periodId, array $payload, Request $request): JsonResponse
    {
        ForumPeriod::findOrFail($periodId);
        $forum = Forum::create([
            ...Arr::only($payload, ['name', 'description', 'visibility', 'responsible_user_id']),
            'forum_period_id' => $periodId,
            'visibility' => $payload['visibility'] ?? 'private',
            'join_code' => $payload['join_code'] ?? $this->code(),
            'is_join_code_active' => $payload['is_join_code_active'] ?? true,
            'is_locked' => false,
            'is_archived' => false,
        ]);

        if ($request->user()) $this->ensureParticipant($forum, $request->user(), 'auditor', $request->user(), false);
        if ($forum->responsible_user_id && $responsible = User::find($forum->responsible_user_id)) $this->ensureParticipant($forum, $responsible, 'auditor', $request->user(), true);
        foreach ($payload['participant_ids'] ?? [] as $userId) if ($user = User::find($userId)) $this->ensureParticipant($forum, $user, 'auditee', $request->user(), false);
        foreach ($payload['auditor_ids'] ?? [] as $userId) if ($user = User::find($userId)) $this->ensureParticipant($forum, $user, 'auditor', $request->user(), false);
        foreach ($payload['auditee_ids'] ?? [] as $userId) if ($user = User::find($userId)) $this->ensureParticipant($forum, $user, 'auditee', $request->user(), false);
        foreach ($payload['participants'] ?? [] as $participant) if ($user = User::find($participant['user_id'] ?? null)) $this->ensureParticipant($forum, $user, $this->role($participant['role'] ?? 'auditee'), $request->user(), (bool) ($participant['is_responsible_user'] ?? false));

        $this->audit->record($request->user(), 'forum', $forum->id, 'create_forum', [], $request);

        return $this->forumResponse($forum, 'Forum created successfully', $request);
    }

    public function show(string $roomId, Request $request): JsonResponse
    {
        return $this->forumResponse(Forum::withTrashed()->findOrFail($roomId), 'Forum retrieved successfully', $request);
    }

    public function update(string $roomId, array $payload, Request $request): JsonResponse
    {
        $forum = Forum::withTrashed()->findOrFail($roomId);
        $forum->fill(Arr::only($payload, ['name', 'description', 'visibility', 'responsible_user_id', 'join_code', 'is_join_code_active', 'is_locked', 'is_archived']))->save();
        if ($forum->responsible_user_id && $responsible = User::find($forum->responsible_user_id)) $this->ensureParticipant($forum, $responsible, 'auditor', $request->user(), true);
        $this->audit->record($request->user(), 'forum', $forum->id, 'update_forum', [], $request);

        return $this->forumResponse($forum, 'Forum updated successfully', $request);
    }

    public function destroy(string $roomId, Request $request): JsonResponse
    {
        $forum = Forum::findOrFail($roomId);
        $forum->forceFill(['deleted_by' => $request->user()?->id])->save();
        $forum->delete();
        $this->audit->record($request->user(), 'forum', $forum->id, 'delete_forum', ['reason' => $request->input('reason')], $request);

        return ApiResponse::success([], 'Forum deleted successfully');
    }

    public function join(array $payload, Request $request): JsonResponse
    {
        $code = $payload['join_code'] ?? $payload['code'] ?? null;
        $forum = Forum::where('join_code', $code)->where('is_join_code_active', true)->where('is_archived', false)->firstOrFail();
        $participant = $this->ensureParticipant($forum, $request->user(), 'auditee', $request->user(), false);
        $this->audit->record($request->user(), 'forum', $forum->id, 'join_forum', [], $request);
        $forumPayload = $this->forumPayload($forum, $request);

        return ApiResponse::success(['forum' => $forumPayload, 'room' => $forumPayload, 'participant' => $participant], 'Forum joined successfully', 200, ['forum' => $forumPayload, 'room' => $forumPayload, 'participant' => $participant]);
    }

    public function setState(string $roomId, string $state, Request $request): JsonResponse
    {
        $forum = Forum::withTrashed()->findOrFail($roomId);
        if ($state === 'lock') $forum->is_locked = true;
        if ($state === 'unlock') $forum->is_locked = false;
        if ($state === 'archive') $forum->is_archived = true;
        if ($state === 'restore') {
            $forum->restore();
            $forum->is_archived = false;
        }
        $forum->save();
        $this->audit->record($request->user(), 'forum', $forum->id, $state.'_forum', [], $request);

        return $this->forumResponse($forum, 'Forum '.str_replace('_', ' ', $state).'d successfully', $request);
    }

    public function ensureParticipant(Forum $forum, ?User $user, string $role, ?User $actor, bool $responsible): ?ForumParticipant
    {
        if (! $user) return null;
        $participant = ForumParticipant::withTrashed()->firstOrNew(['forum_id' => $forum->id, 'user_id' => $user->id]);
        $participant->fill(['role' => $this->role($role), 'is_responsible_user' => $responsible, 'added_by' => $actor?->id, 'added_at' => $participant->added_at ?: now(), 'removed_at' => null, 'removed_by' => null, 'remove_reason' => null]);
        $participant->deleted_at = null;
        $participant->save();
        if ($responsible) $forum->forceFill(['responsible_user_id' => $user->id])->save();

        return $participant;
    }

    private function forumResponse(Forum $forum, string $message, Request $request): JsonResponse
    {
        $payload = $this->forumPayload($forum, $request);
        return ApiResponse::success(['forum' => $payload, 'room' => $payload], $message, 200, ['forum' => $payload, 'room' => $payload]);
    }

    private function forumPayload(Forum $forum, Request $request): array
    {
        $forum->load(['period', 'responsibleUser', 'participants.user', 'participants.addedBy'])->loadCount(['participants', 'topics', 'attachments']);
        return (new ForumDetailResource($forum))->resolve($request);
    }

    private function role(string $role): string
    {
        return in_array($role, ['auditor', 'auditee'], true) ? $role : 'auditee';
    }

    private function code(): string
    {
        return 'FRM-'.Str::upper(Str::random(8));
    }

    private function pagination($paginator): array
    {
        return ['current_page' => $paginator->currentPage(), 'per_page' => $paginator->perPage(), 'total' => $paginator->total(), 'last_page' => $paginator->lastPage(), 'from' => $paginator->firstItem(), 'to' => $paginator->lastItem()];
    }
}
