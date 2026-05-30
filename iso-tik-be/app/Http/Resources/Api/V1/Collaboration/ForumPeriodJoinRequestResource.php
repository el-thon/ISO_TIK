<?php

namespace App\Http\Resources\Api\V1\Collaboration;

use App\Http\Resources\Api\V1\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ForumPeriodJoinRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'forum_period_id' => $this->forum_period_id,
            'requester_user_id' => $this->requester_user_id,
            'requester' => $this->whenLoaded('requester', fn () => new UserResource($this->requester)),
            'status' => $this->status,
            'reviewed_by_user_id' => $this->reviewed_by_user_id,
            'reviewer' => $this->whenLoaded('reviewer', fn () => new UserResource($this->reviewer)),
            'reviewed_at' => optional($this->reviewed_at)->toISOString(),
            'rejection_reason' => $this->rejection_reason,
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];
    }
}
