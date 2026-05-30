<?php

namespace App\Http\Resources\Api\V1\Content;

use App\Http\Resources\Api\V1\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TopicVersionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'topic_id' => $this->topic_id,
            'version_number' => $this->version_number,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'workflow_status' => $this->status,
            'snapshot_data' => $this->snapshot_data ?: [],
            'changed_by_user_id' => $this->changed_by_user_id,
            'changed_by' => $this->whenLoaded('changedBy', fn () => new UserResource($this->changedBy)),
            'change_reason' => $this->change_reason,
            'change_type' => $this->change_type,
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];
    }
}
