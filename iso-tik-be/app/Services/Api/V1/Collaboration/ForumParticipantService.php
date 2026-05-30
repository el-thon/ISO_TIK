<?php

namespace App\Services\Api\V1\Collaboration;

use App\Http\Resources\Api\V1\Collaboration\ForumParticipantResource;
use App\Models\Collaboration\Forum;
use App\Models\Collaboration\ForumParticipant;
use App\Models\User;
use App\Services\Api\V1\Security\AuditLogService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ForumParticipantService
{
    public function __construct(private readonly ForumService $forums, private readonly AuditLogService $audit) {}

    public function index(string $roomId, Request $request): JsonResponse
    {
        Forum::findOrFail($roomId);
        $search = $request->input('search');
        $query = ForumParticipant::forForum($roomId)->active()->with('user.profile', 'user.contact', 'user.employment')
            ->when($request->input('role'), fn ($q, $role) => $q->where('role', $this->role($role)))
            ->when($search, fn ($q) => $q->whereHas('user', fn ($u) => $u->where('name', 'ilike', "%{$search}%")->orWhere('email', 'ilike', "%{$search}%")->orWhereHas('profile', fn ($p) => $p->where('full_name', 'ilike', "%{$search}%"))));

        $paginator = $query->latest()->paginate((int) $request->integer('per_page', 10));
        $items = collect($paginator->items())->map(fn ($item) => (new ForumParticipantResource($item))->resolve())->values()->all();
        $pagination = $this->pagination($paginator);

        return response()->json(['success' => true, 'message' => 'Participants retrieved successfully', 'data' => ['participants' => $items, 'users' => $items, 'items' => $items], 'participants' => $items, 'users' => $items, 'items' => $items, 'meta' => $pagination, 'pagination' => $pagination]);
    }

    public function store(string $roomId, array $payload, Request $request): JsonResponse
    {
        $forum = Forum::findOrFail($roomId);
        $created = [];
        foreach ($this->participantPayloads($payload) as $participant) {
            if ($user = User::find($participant['user_id'])) {
                $created[] = $this->forums->ensureParticipant($forum, $user, $this->role($participant['role'] ?? $payload['role'] ?? 'auditee'), $request->user(), (bool) ($participant['is_responsible_user'] ?? $payload['is_responsible_user'] ?? false));
            }
        }
        $items = collect($created)->map(fn ($item) => (new ForumParticipantResource($item->load('user')))->resolve())->values()->all();
        $this->audit->record($request->user(), 'forum', $forum->id, 'add_participant', ['count' => count($items)], $request);

        return ApiResponse::success(['participants' => $items, 'users' => $items, 'items' => $items], 'Participant added successfully', 200, ['participants' => $items, 'users' => $items, 'items' => $items]);
    }

    public function update(string $roomId, string $participantId, array $payload, Request $request): JsonResponse
    {
        $participant = ForumParticipant::forForum($roomId)->findOrFail($participantId);
        $participant->fill(['role' => $this->role($payload['role'] ?? $participant->role), 'is_responsible_user' => $payload['is_responsible_user'] ?? $participant->is_responsible_user])->save();
        if ($participant->is_responsible_user) Forum::where('id', $roomId)->update(['responsible_user_id' => $participant->user_id]);
        $this->audit->record($request->user(), 'forum_participant', $participant->id, 'update_participant', [], $request);
        $item = (new ForumParticipantResource($participant->fresh('user')))->resolve();

        return ApiResponse::success(['participant' => $item], 'Participant updated successfully', 200, ['participant' => $item]);
    }

    public function destroy(string $roomId, string $participantId, Request $request): JsonResponse
    {
        $participant = ForumParticipant::forForum($roomId)->findOrFail($participantId);
        $participant->forceFill(['removed_at' => now(), 'removed_by' => $request->user()?->id, 'remove_reason' => $request->input('reason')])->save();
        $this->audit->record($request->user(), 'forum_participant', $participant->id, 'remove_participant', [], $request);

        return ApiResponse::success([], 'Participant removed successfully');
    }

    public function leave(string $roomId, Request $request): JsonResponse
    {
        $participant = ForumParticipant::forForum($roomId)->forUser($request->user()->id)->active()->firstOrFail();
        if ($participant->is_responsible_user) return ApiResponse::error('Responsible user cannot leave forum', 422);
        $participant->forceFill(['removed_at' => now(), 'removed_by' => $request->user()->id, 'remove_reason' => 'leave'])->save();
        $this->audit->record($request->user(), 'forum', $roomId, 'leave_forum', [], $request);

        return ApiResponse::success([], 'Left forum successfully');
    }

    private function participantPayloads(array $payload): array
    {
        if ($payload['participants'] ?? null) return $payload['participants'];
        if ($payload['user_ids'] ?? null) return collect($payload['user_ids'])->map(fn ($id) => ['user_id' => $id])->all();
        return ($payload['user_id'] ?? null) ? [['user_id' => $payload['user_id']]] : [];
    }

    private function role(string $role): string
    {
        return in_array($role, ['auditor', 'auditee'], true) ? $role : 'auditee';
    }

    private function pagination($paginator): array
    {
        return ['current_page' => $paginator->currentPage(), 'per_page' => $paginator->perPage(), 'total' => $paginator->total(), 'last_page' => $paginator->lastPage(), 'from' => $paginator->firstItem(), 'to' => $paginator->lastItem()];
    }
}
