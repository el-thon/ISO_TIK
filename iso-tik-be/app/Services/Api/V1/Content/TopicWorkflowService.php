<?php

namespace App\Services\Api\V1\Content;

use App\Http\Resources\Api\V1\Content\WorkflowStateResource;
use App\Models\Content\Topic;
use App\Models\Workflow\WorkflowState;
use App\Services\Api\V1\Security\AuditLogService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TopicWorkflowService
{
    public function __construct(private readonly TopicService $topics, private readonly TopicVersionService $versions, private readonly AuditLogService $audit) {}

    public function transition(string $topicId, string $status, Request $request, array $extra = []): JsonResponse
    {
        $topic = Topic::findOrFail($topicId);
        $from = $topic->status;
        $reason = $request->input('reason') ?: $request->input('comment') ?: $request->input('freeze_reason');
        $to = $status === 'unfreeze' ? $topic->status : $this->topics->status($status);
        $workflowTo = $status === 'frozen' ? 'frozen' : $to;

        if ($status !== 'frozen' && $status !== 'unfreeze') {
            $topic->status = $to;
        }

        if ($status === 'frozen') {
            $topic->is_frozen = true;
            $topic->frozen_by_user_id = $request->user()?->id;
            $topic->frozen_until = $request->input('until') ?: $request->input('frozen_until');
        } elseif ($status === 'unfreeze') {
            $topic->is_frozen = false;
            $topic->frozen_until = null;
        }
        $topic->save();
        $workflow = WorkflowState::create(['topic_id' => $topic->id, 'from_status' => $from, 'to_status' => $workflowTo, 'reason' => $reason, 'changed_by_user_id' => $request->user()?->id, 'changed_at' => now()]);
        $this->versions->snapshot($topic->fresh(), $reason, $status, $request->user()?->id);
        $this->audit->record($request->user(), 'topic', $topic->id, $status.'_topic', ['from' => $from, 'to' => $workflowTo], $request);
        $topicPayload = $this->topics->payload($topic->fresh(), $request, true);
        $workflowPayload = (new WorkflowStateResource($workflow->load('changedBy')))->resolve();
        return ApiResponse::success(['topic' => $topicPayload, 'workflow' => $workflowPayload], 'Topic status updated successfully', 200, ['topic' => $topicPayload, 'workflow' => $workflowPayload]);
    }
}
