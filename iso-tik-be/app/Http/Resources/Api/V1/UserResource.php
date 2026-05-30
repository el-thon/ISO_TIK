<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'username' => $this->username,
            'status' => $this->status,
            'photo_url' => $this->photo_url,
            'roles' => $this->whenLoaded('roles', fn () => $this->roles->pluck('name')->values()->all(), []),
            'profile' => $this->whenLoaded('profile'),
            'contact' => $this->whenLoaded('contact'),
            'address' => $this->whenLoaded('address'),
            'employment' => $this->whenLoaded('employment'),
        ];
    }
}
