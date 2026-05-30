<?php

namespace App\Http\Resources\Api\V1\Content;

use App\Http\Resources\Api\V1\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkflowStateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $toStatus = $this->frontendStatus((string) $this->to_status);

        return [
            'id' => $this->id,
            'topic_id' => $this->topic_id,
            'from_status' => $this->from_status,
            'to_status' => $this->to_status,
            'status' => $toStatus,
            'workflow_status' => $toStatus,
            'legacy_status' => $this->to_status,
            'status_alias' => $this->statusAlias((string) $this->to_status),
            'reason' => $this->reason,
            'changed_by_user_id' => $this->changed_by_user_id,
            'changed_by' => $this->whenLoaded('changedBy', fn () => new UserResource($this->changedBy)),
            'changed_at' => optional($this->changed_at)->toISOString(),
            'created_at' => optional($this->created_at)->toISOString(),
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
