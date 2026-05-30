<?php

namespace App\Http\Resources\Api\V1\User;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserSearchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->id,
            'name' => $this->profile?->full_name ?: $this->name ?: $this->username,
            'username' => $this->username,
            'email' => $this->email,
            'status' => $this->status,
            'photo_url' => $this->photo_url,
            'roles' => $this->roles?->pluck('name')->values()->all() ?? [],
            'profile' => $this->profile,
            'contact' => $this->contact,
            'employment' => $this->employment,
            'user' => [
                'id' => $this->id,
                'username' => $this->username,
                'email' => $this->email,
                'profile' => $this->profile,
            ],
        ];
    }
}
