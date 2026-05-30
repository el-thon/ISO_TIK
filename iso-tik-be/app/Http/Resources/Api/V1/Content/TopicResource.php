<?php

namespace App\Http\Resources\Api\V1\Content;

use App\Http\Resources\Api\V1\Collaboration\ForumParticipantResource;
use App\Http\Resources\Api\V1\Collaboration\ForumResource;
use App\Http\Resources\Api\V1\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TopicResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $participant = $request->user() && $this->forum && $this->forum->relationLoaded('participants')
            ? $this->forum->participants->first(fn ($item) => $item->user_id === $request->user()->id && $item->removed_at === null)
            : null;
        $master = $this->whenLoaded('documentMaster', fn () => $this->documentMaster);
        $status = $this->frontendStatus((string) $this->status);
        $statusAlias = $this->statusAlias((string) $this->status);

        return [
            'id' => $this->id,
            'forum_id' => $this->forum_id,
            'topic_document_master_id' => $this->document_master_id,
            'document_master_id' => $this->document_master_id,
            'document_number' => $this->documentMaster?->document_number,
            'revision_number' => $this->documentMaster?->revision_number,
            'title' => $this->title,
            'name' => $this->title,
            'description' => $this->description,
            'status' => $status,
            'workflow_status' => $status,
            'legacy_status' => $this->status,
            'status_alias' => $statusAlias,
            'finding_type' => $this->status === 'draft' ? 'finding' : null,
            'version_major' => $this->version_major,
            'version_minor' => $this->version_minor,
            'deadline_at' => optional($this->deadline_at)->toISOString(),
            'is_frozen' => (bool) $this->is_frozen,
            'freeze_status' => $this->is_frozen ? 'frozen' : null,
            'frozen_reason' => null,
            'frozen_until' => optional($this->frozen_until)->toISOString(),
            'created_by_user_id' => $this->created_by_user_id,
            'created_by' => $this->whenLoaded('creator', fn () => new UserResource($this->creator)),
            'forum' => $this->whenLoaded('forum', fn () => new ForumResource($this->forum)),
            'period' => $this->forum?->relationLoaded('period') ? $this->forum->period : null,
            'document_master' => $master,
            'input_items_count' => $this->input_items_count ?? null,
            'versions_count' => $this->versions_count ?? null,
            'workflow' => $this->workflowStates->first() ? (new WorkflowStateResource($this->workflowStates->first()))->resolve() : ['status' => $status, 'workflow_status' => $status, 'legacy_status' => $this->status, 'status_alias' => $statusAlias],
            'workflow_state' => $this->workflowStates->first() ? (new WorkflowStateResource($this->workflowStates->first()))->resolve() : null,
            'current_user_participant' => $participant ? (new ForumParticipantResource($participant))->resolve() : null,
            'current_user_role' => $participant?->role,
            'user_role' => $participant?->role,
            'can_edit' => (bool) $request->user()?->isAdmin() || (bool) $participant,
            'can_publish' => (bool) $request->user()?->isAdmin() || $participant?->role === 'auditor',
            'can_approve' => (bool) $request->user()?->isAdmin() || (bool) $request->user()?->isProductOwner(),
            'can_request_changes' => (bool) $request->user()?->isAdmin() || (bool) $request->user()?->isProductOwner(),
            'can_close' => (bool) $request->user()?->isAdmin(),
            'can_reopen' => (bool) $request->user()?->isAdmin(),
            'can_freeze' => (bool) $request->user()?->isAdmin(),
            'can_unfreeze' => (bool) $request->user()?->isAdmin(),
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
            'deleted_at' => optional($this->deleted_at)->toISOString(),
        ];
    }

    private function frontendStatus(string $status): string
    {
        return $status === 'published' ? 'in_review' : $status;
    }

    private function statusAlias(string $status): ?string
    {
        return match ($status) {
            'in_review' => 'published',
            'published' => 'published',
            default => null,
        };
    }
}
