<?php

namespace App\Services\Api\V1\Auth;

use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;

class TokenResponseFactory
{
    public function login(
        string $accessToken,
        ?string $refreshToken,
        array|JsonResource $user,
        array $roles = [],
        ?string $accessExpiresAt = null,
        ?string $refreshExpiresAt = null,
        ?int $expiresIn = null,
        string $message = 'Login successful'
    ): JsonResponse {
        return ApiResponse::token([
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'accessToken' => $accessToken,
            'refreshToken' => $refreshToken,
            'token' => $accessToken,
            'token_type' => 'Bearer',
            'access_expires_at' => $accessExpiresAt,
            'refresh_expires_at' => $refreshExpiresAt,
            'accessExpiresAt' => $accessExpiresAt,
            'refreshExpiresAt' => $refreshExpiresAt,
            'expires_in' => $expiresIn,
        ], $user, $roles, $message);
    }

    public function otpRequired(array $payload): JsonResponse
    {
        return ApiResponse::success(
            array_merge([
                'otp_required' => true,
                'requires_otp' => true,
                'step' => 'otp',
            ], $payload),
            'OTP verification required',
            200,
            array_merge([
                'otp_required' => true,
                'requires_otp' => true,
                'step' => 'otp',
            ], $payload)
        );
    }
}
