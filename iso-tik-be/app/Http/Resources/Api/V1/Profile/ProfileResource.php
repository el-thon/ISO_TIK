<?php

namespace App\Http\Resources\Api\V1\Profile;

use App\Http\Resources\Api\V1\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $this->resource;
        $user->loadMissing('roles', 'profile', 'contact', 'address', 'employment');

        return [
            'user' => (new UserResource($user))->resolve($request),
            'profile' => $user->profile,
            'contact' => $user->contact,
            'address' => $user->address,
            'employment' => $user->employment,
            'roles' => $user->roles->pluck('name')->values()->all(),
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'username' => $user->username,
            'photo_url' => $user->photo_url,
        ];
    }
}
