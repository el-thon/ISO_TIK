<?php

namespace App\Http\Resources\Api\V1\Admin\User;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminActivityLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'actor_user_id' => $this->actor_user_id ?? $this->user_id,
            'entity_type' => $this->entity_type ?? 'login_history',
            'entity_id' => $this->entity_id ?? $this->user_id,
            'action' => $this->action ?? $this->login_method,
            'category' => $this->category ?? 'authentication',
            'severity' => $this->severity ?? 'info',
            'status' => $this->status ?? null,
            'details' => $this->details ?? ['failure_reason' => $this->failure_reason ?? null],
            'ip_address' => $this->ip_address,
            'user_agent' => $this->user_agent,
            'timestamp' => ($this->timestamp ?? $this->login_at ?? $this->created_at)?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
