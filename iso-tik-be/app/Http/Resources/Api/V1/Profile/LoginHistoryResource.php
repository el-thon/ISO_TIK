<?php

namespace App\Http\Resources\Api\V1\Profile;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LoginHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'login_at' => $this->login_at?->toIso8601String(),
            'logout_at' => $this->logout_at?->toIso8601String(),
            'ip_address' => $this->ip_address,
            'user_agent' => $this->user_agent,
            'device_fingerprint' => $this->device_fingerprint,
            'location' => $this->location,
            'login_method' => $this->login_method,
            'status' => $this->status,
            'failure_reason' => $this->failure_reason,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
