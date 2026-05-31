<?php

namespace App\Services\Api\V1\Collaboration;

use App\Http\Resources\Api\V1\Collaboration\ForumPeriodDetailResource;
use App\Http\Resources\Api\V1\Collaboration\ForumPeriodResource;
use App\Models\Collaboration\ForumPeriod;
use App\Models\Collaboration\ForumPeriodJoinRequest;
use App\Models\Collaboration\ForumPeriodMember;
use App\Models\User;
use App\Services\Api\V1\Security\AuditLogService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class ForumPeriodService
{
    public function __construct(private readonly AuditLogService $audit) {}

    public function index(Request $request): JsonResponse
    {
        $search = $request->input('search') ?: $request->input('q') ?: $request->input('keyword');
        $query = ForumPeriod::query()
            ->with(['creator', 'members', 'joinRequests'])
            ->withCount(['members', 'forums', 'joinRequests'])
            ->when($request->boolean('include_archived'), fn ($q) => $q->withTrashed())
            ->when($request->input('period_type'), fn ($q, $v) => $q->where('period_type', $v))
            ->when($request->has('is_active'), fn ($q) => $request->boolean('is_active') ? $q->active() : $q)
            ->when($search, fn ($q) => $q->where(fn ($i) => $i->where('name', 'ilike', "%{$search}%")->orWhere('period_type', 'ilike', "%{$search}%")));

        $paginator = $query->latest()->paginate((int) $request->integer('per_page', 10));
        $items = collect($paginator->items())->map(fn ($period) => (new ForumPeriodResource($period))->resolve())->values()->all();
        $pagination = $this->pagination($paginator);

        return response()->json([
            'success' => true,
            'message' => 'Periods retrieved successfully',
            'data' => ['periods' => $items, 'items' => $items, 'results' => $items, 'list' => $items],
            'periods' => $items,
            'items' => $items,
            'results' => $items,
            'list' => $items,
            'meta' => $pagination,
            'pagination' => $pagination,
        ]);
    }

    public function store(array $payload, Request $request): JsonResponse
    {
        if (! $request->user()?->hasRole('admin')) {
            return ApiResponse::forbidden('Only admin can manage periods');
        }

        $period = ForumPeriod::create([
            ...Arr::only($payload, ['name', 'period_type', 'start_date', 'end_date']),
            'period_type' => $this->periodType($payload['period_type'] ?? null),
            'join_code' => $payload['join_code'] ?? $this->code('PER'),
            'is_join_code_active' => $payload['is_join_code_active'] ?? true,
            'created_by_user_id' => $request->user()?->id,
        ]);

        $this->ensureMember($period, $request->user(), 'owner', $request->user());
        $this->audit->record($request->user(), 'forum_period', $period->id, 'create_period', [], $request);

        return $this->periodResponse($period, 'Period created successfully', $request);
    }

    public function show(string $periodId, Request $request): JsonResponse
    {
        $period = ForumPeriod::withTrashed()->findOrFail($periodId);
        if (! $this->canAccessPeriod($period, $request)) {
            return ApiResponse::forbidden('You are not a member of this period');
        }

        return $this->periodResponse($period, 'Period retrieved successfully', $request);
    }

    public function update(string $periodId, array $payload, Request $request): JsonResponse
    {
        if (! $request->user()?->hasRole('admin')) {
            return ApiResponse::forbidden('Only admin can manage periods');
        }

        $period = ForumPeriod::withTrashed()->findOrFail($periodId);
        if (array_key_exists('period_type', $payload)) {
            $payload['period_type'] = $this->periodType($payload['period_type']);
        }

        $period->fill(Arr::only($payload, ['name', 'period_type', 'start_date', 'end_date', 'join_code', 'is_join_code_active']))->save();
        $this->audit->record($request->user(), 'forum_period', $period->id, 'update_period', [], $request);

        return $this->periodResponse($period, 'Period updated successfully', $request);
    }

    public function join(array $payload, Request $request): JsonResponse
    {
        $code = $payload['join_code'] ?? $payload['code'] ?? null;
        $period = ForumPeriod::query()
            ->when($payload['period_id'] ?? null, fn ($q, $id) => $q->where('id', $id))
            ->when($code, fn ($q) => $q->where('join_code', $code))
            ->where('is_join_code_active', true)
            ->firstOrFail();

        $member = ForumPeriodMember::where('forum_period_id', $period->id)
            ->where('user_id', $request->user()->id)
            ->whereNull('deleted_at')
            ->first();

        if ($member) {
            $periodPayload = (new ForumPeriodResource($period->fresh(['creator', 'members', 'joinRequests'])->loadCount(['members', 'forums', 'joinRequests'])))->resolve($request);

            return ApiResponse::success(
                ['period' => $periodPayload, 'join_request' => null, 'member' => $member, 'is_member' => true],
                'You are already a member of this period',
                200,
                ['period' => $periodPayload, 'join_request' => null, 'member' => $member, 'is_member' => true]
            );
        }

        $joinRequest = ForumPeriodJoinRequest::updateOrCreate(
            ['forum_period_id' => $period->id, 'requester_user_id' => $request->user()->id],
            ['status' => 'pending', 'reviewed_by_user_id' => null, 'reviewed_at' => null, 'rejection_reason' => null]
        );
        $this->audit->record($request->user(), 'forum_period', $period->id, 'request_join_period', [], $request);

        $periodPayload = (new ForumPeriodResource($period->fresh(['creator', 'members', 'joinRequests'])->loadCount(['members', 'forums', 'joinRequests'])))->resolve($request);

        return ApiResponse::success(
            ['period' => $periodPayload, 'join_request' => $joinRequest, 'member' => null, 'is_member' => false],
            'Join request submitted successfully',
            200,
            ['period' => $periodPayload, 'join_request' => $joinRequest, 'member' => null, 'is_member' => false]
        );
    }

    public function ensureMember(ForumPeriod $period, ?User $user, string $role, ?User $actor): ?ForumPeriodMember
    {
        if (! $user) return null;

        return ForumPeriodMember::updateOrCreate(
            ['forum_period_id' => $period->id, 'user_id' => $user->id],
            ['role' => $role, 'added_by' => $actor?->id, 'added_at' => now(), 'deleted_at' => null]
        );
    }

    private function canAccessPeriod(ForumPeriod $period, Request $request): bool
    {
        $user = $request->user();
        if (! $user) return false;
        if ($user->hasRole('product_owner')) return true;

        return $period->members()
            ->where('user_id', $user->id)
            ->whereNull('deleted_at')
            ->exists();
    }

    private function periodResponse(ForumPeriod $period, string $message, Request $request): JsonResponse
    {
        $period->load(['creator', 'members.user', 'joinRequests'])->loadCount(['members', 'forums', 'joinRequests']);
        $payload = (new ForumPeriodDetailResource($period))->resolve($request);

        return ApiResponse::success(['period' => $payload], $message, 200, ['period' => $payload]);
    }

    private function code(string $prefix): string
    {
        return $prefix.'-'.Str::upper(Str::random(8));
    }

    private function periodType(?string $value): string
    {
        return match (strtolower((string) ($value ?: 'annual'))) {
            'semester', 'annual', 'custom' => strtolower((string) ($value ?: 'annual')),
            'audit', 'audit_period', 'period_audit' => 'custom',
            default => 'custom',
        };
    }

    private function pagination($paginator): array
    {
        return ['current_page' => $paginator->currentPage(), 'per_page' => $paginator->perPage(), 'total' => $paginator->total(), 'last_page' => $paginator->lastPage(), 'from' => $paginator->firstItem(), 'to' => $paginator->lastItem()];
    }
}
