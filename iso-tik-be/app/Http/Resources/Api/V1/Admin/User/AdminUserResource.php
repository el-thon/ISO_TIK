<?php

namespace App\Http\Resources\Api\V1\Admin\User;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->loadMissing('roles', 'profile', 'contact', 'address', 'employment');

        return [
            'id' => $this->id,
            'user_id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'username' => $this->username,
            'status' => $this->status,
            'photo_url' => $this->photo_url,
            'roles' => $this->roles->pluck('name')->values()->all(),
            'role_objects' => AdminRoleResource::collection($this->roles)->resolve(),
            'profile' => $this->profile,
            'contact' => $this->contact,
            'address' => $this->address,
            'employment' => $this->employment,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'deleted_at' => $this->deleted_at?->toIso8601String(),
        ];
    }
}
