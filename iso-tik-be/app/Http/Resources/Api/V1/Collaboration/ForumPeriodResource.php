<?php

namespace App\Http\Resources\Api\V1\Collaboration;

use App\Http\Resources\Api\V1\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ForumPeriodResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'period_type' => $this->period_type,
            'start_date' => optional($this->start_date)->toDateString(),
            'end_date' => optional($this->end_date)->toDateString(),
            'join_code' => $this->join_code,
            'is_join_code_active' => (bool) $this->is_join_code_active,
            'created_by_user_id' => $this->created_by_user_id,
            'created_by' => $this->whenLoaded('creator', fn () => new UserResource($this->creator)),
            'members_count' => $this->members_count ?? null,
            'forums_count' => $this->forums_count ?? null,
            'join_requests_count' => $this->join_requests_count ?? null,
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
            'deleted_at' => optional($this->deleted_at)->toISOString(),
        ];
    }
}
