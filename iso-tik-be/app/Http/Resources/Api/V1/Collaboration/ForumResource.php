<?php

namespace App\Http\Resources\Api\V1\Collaboration;

use App\Http\Resources\Api\V1\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ForumResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $participant = $request->user() && $this->relationLoaded('participants')
            ? $this->participants->first(fn ($item) => $item->user_id === $request->user()->id && $item->removed_at === null)
            : null;

        return [
            'id' => $this->id,
            'forum_period_id' => $this->forum_period_id,
            'period_id' => $this->forum_period_id,
            'name' => $this->name,
            'description' => $this->description,
            'is_locked' => (bool) $this->is_locked,
            'is_archived' => (bool) $this->is_archived,
            'visibility' => $this->visibility,
            'responsible_user_id' => $this->responsible_user_id,
            'responsible_user' => $this->whenLoaded('responsibleUser', fn () => new UserResource($this->responsibleUser)),
            'join_code' => $this->join_code,
            'is_join_code_active' => (bool) $this->is_join_code_active,
            'period' => $this->whenLoaded('period', fn () => new ForumPeriodResource($this->period)),
            'participants_count' => $this->participants_count ?? null,
            'topics_count' => $this->topics_count ?? null,
            'attachments_count' => $this->attachments_count ?? null,
            'current_user_participant' => $participant ? (new ForumParticipantResource($participant))->resolve() : null,
            'current_user_role' => $participant?->role,
            'user_role' => $participant?->role,
            'is_related' => $participant !== null || (bool) $request->user()?->hasAnyRole(['admin', 'product_owner']),
            'can_manage' => (bool) $request->user()?->isAdmin(),
            'can_edit' => (bool) $request->user()?->isAdmin(),
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
            'deleted_at' => optional($this->deleted_at)->toISOString(),
        ];
    }
}
