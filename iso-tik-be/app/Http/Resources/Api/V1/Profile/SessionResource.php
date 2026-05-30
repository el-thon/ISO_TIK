<?php

namespace App\Http\Resources\Api\V1\Profile;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'token_type' => $this->token_type,
            'ip_address' => $this->ip_address,
            'user_agent' => $this->user_agent,
            'device_fingerprint' => $this->device_fingerprint,
            'expires_at' => $this->expires_at?->toIso8601String(),
            'revoked_at' => $this->revoked_at?->toIso8601String(),
            'revoke_reason' => $this->revoke_reason,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'is_current' => (bool) ($this->is_current ?? false),
        ];
    }
}
