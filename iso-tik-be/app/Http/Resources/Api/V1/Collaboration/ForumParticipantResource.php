<?php

namespace App\Http\Resources\Api\V1\Collaboration;

use App\Http\Resources\Api\V1\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ForumParticipantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'participant_id' => $this->id,
            'forum_id' => $this->forum_id,
            'user_id' => $this->user_id,
            'role' => $this->role,
            'is_responsible_user' => (bool) $this->is_responsible_user,
            'added_by' => $this->added_by,
            'added_at' => optional($this->added_at)->toISOString(),
            'removed_at' => optional($this->removed_at)->toISOString(),
            'removed_by' => $this->removed_by,
            'remove_reason' => $this->remove_reason,
            'user' => $this->whenLoaded('user', fn () => new UserResource($this->user)),
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];
    }
}
