<?php

namespace App\Http\Requests\Api\V1\Auth;

use App\Http\Requests\Api\V1\BaseApiRequest;

class RefreshTokenRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'refresh_token' => ['nullable', 'string'],
            'refreshToken' => ['nullable', 'string'],
        ];
    }

    public function refreshToken(): ?string
    {
        $token = $this->input('refresh_token') ?: $this->input('refreshToken') ?: $this->bearerToken();

        return is_string($token) && trim($token) !== '' ? trim($token) : null;
    }
}
