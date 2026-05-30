<?php

namespace App\Services\Api\V1\Collaboration;

use App\Http\Resources\Api\V1\Collaboration\ForumPeriodJoinRequestResource;
use App\Models\Collaboration\ForumPeriod;
use App\Models\Collaboration\ForumPeriodJoinRequest;
use App\Models\Collaboration\ForumPeriodMember;
use App\Services\Api\V1\Security\AuditLogService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ForumPeriodJoinRequestService
{
    public function __construct(private readonly AuditLogService $audit) {}

    public function index(string $periodId, Request $request): JsonResponse
    {
        ForumPeriod::findOrFail($periodId);
        $search = $request->input('search');
        $query = ForumPeriodJoinRequest::forPeriod($periodId)
            ->with('requester', 'reviewer')
            ->when($request->input('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($search, fn ($q) => $q->whereHas('requester', fn ($u) => $u->where('name', 'ilike', "%{$search}%")->orWhere('email', 'ilike', "%{$search}%")));

        $paginator = $query->latest()->paginate((int) $request->integer('per_page', 10));
        $items = collect($paginator->items())->map(fn ($item) => (new ForumPeriodJoinRequestResource($item))->resolve())->values()->all();
        $pagination = $this->pagination($paginator);

        return response()->json(['success' => true, 'message' => 'Join requests retrieved successfully', 'data' => ['requests' => $items, 'items' => $items], 'requests' => $items, 'items' => $items, 'meta' => $pagination, 'pagination' => $pagination]);
    }

    public function approve(string $periodId, string $joinRequestId, Request $request): JsonResponse
    {
        $joinRequest = ForumPeriodJoinRequest::forPeriod($periodId)->with('requester')->findOrFail($joinRequestId);
        $joinRequest->forceFill(['status' => 'approved', 'reviewed_by_user_id' => $request->user()?->id, 'reviewed_at' => now()])->save();
        $member = ForumPeriodMember::updateOrCreate(
            ['forum_period_id' => $periodId, 'user_id' => $joinRequest->requester_user_id],
            ['role' => $request->input('role', 'member'), 'added_by' => $request->user()?->id, 'added_at' => now(), 'deleted_at' => null]
        );
        $this->audit->record($request->user(), 'forum_period_join_request', $joinRequest->id, 'approve_join_request', [], $request);
        $payload = (new ForumPeriodJoinRequestResource($joinRequest->fresh(['requester', 'reviewer'])))->resolve();

        return ApiResponse::success(['join_request' => $payload, 'member' => $member], 'Join request approved successfully', 200, ['join_request' => $payload, 'member' => $member]);
    }

    private function pagination($paginator): array
    {
        return ['current_page' => $paginator->currentPage(), 'per_page' => $paginator->perPage(), 'total' => $paginator->total(), 'last_page' => $paginator->lastPage(), 'from' => $paginator->firstItem(), 'to' => $paginator->lastItem()];
    }
}
