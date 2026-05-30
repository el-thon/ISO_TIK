<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Api\V1\Auth\LoginRequest;
use App\Http\Requests\Api\V1\Auth\RefreshTokenRequest;
use App\Http\Requests\Api\V1\Auth\ResendLoginOtpRequest;
use App\Services\Api\V1\Auth\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends BaseApiController
{
    public function __construct(private readonly AuthService $auth) {}

    public function login(LoginRequest $request): JsonResponse
    {
        return $this->auth->login(
            $request->identifier(),
            (string) $request->input('password'),
            $request->input('otp'),
            $request
        );
    }

    public function resendLoginOtp(ResendLoginOtpRequest $request): JsonResponse
    {
        return $this->auth->resendLoginOtp(
            $request->identifier(),
            $request->input('password'),
            $request
        );
    }

    public function refresh(RefreshTokenRequest $request): JsonResponse
    {
        return $this->auth->refresh($request->refreshToken(), $request);
    }

    public function logout(Request $request): JsonResponse
    {
        return $this->auth->logout($request);
    }

    public function me(Request $request): JsonResponse
    {
        return $this->auth->me($request->user());
    }
}
