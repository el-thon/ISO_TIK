<?php

namespace App\Services\Api\V1\Auth;

use App\Http\Resources\Api\V1\UserResource;
use App\Models\Auth\LoginHistory;
use App\Models\User;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    private const MAX_FAILED_LOGIN_ATTEMPTS = 5;

    public function __construct(
        private readonly TokenService $tokens,
        private readonly OtpService $otps,
        private readonly TokenResponseFactory $responses,
    ) {}

    public function login(string $identifier, string $password, ?string $otp, Request $request): JsonResponse
    {
        $user = $this->findUser($identifier);

        if (! $user) {
            return ApiResponse::error('Invalid credentials', 401);
        }

        if ($user->account_locked_at !== null || $user->status === 'locked') {
            $this->recordLoginHistory($user, $request, 'failed', 'password', 'account_locked');

            return ApiResponse::error('Account is locked', 403);
        }

        if ($user->status === 'suspended') {
            $this->recordLoginHistory($user, $request, 'failed', 'password', 'account_suspended');

            return ApiResponse::error('Account is suspended', 403);
        }

        if ($user->status === 'inactive') {
            $this->recordLoginHistory($user, $request, 'failed', 'password', 'account_inactive');

            return ApiResponse::error('Account is inactive', 403);
        }

        if ($user->status !== 'active') {
            $this->recordLoginHistory($user, $request, 'failed', 'password', 'account_not_active');

            return ApiResponse::error('Account is '.$user->status, 403);
        }

        if (! Hash::check($password, $user->password_hash)) {
            $attempts = ((int) $user->failed_login_attempts) + 1;

            $updates = ['failed_login_attempts' => $attempts];
            if ($attempts >= self::MAX_FAILED_LOGIN_ATTEMPTS) {
                $updates['account_locked_at'] = now();
                $updates['lock_reason'] = 'too_many_failed_login_attempts';
            }

            $user->forceFill($updates)->save();
            $this->recordLoginHistory(
                $user,
                $request,
                'failed',
                'password',
                $attempts >= self::MAX_FAILED_LOGIN_ATTEMPTS ? 'account_locked_too_many_failed_attempts' : 'Invalid credentials'
            );

            if ($attempts >= self::MAX_FAILED_LOGIN_ATTEMPTS) {
                return ApiResponse::error('Account is locked due to too many failed login attempts', 403);
            }

            return ApiResponse::error('Invalid credentials', 401);
        }

        if ($this->otps->isLoginOtpEnabled()) {
            if (! $otp) {
                $otpData = $this->otps->issue($user, $request);

                return $this->responses->otpRequired($this->otps->otpRequiredPayload($user, $identifier, $otpData));
            }

            $otpResult = $this->otps->validate($user, $otp);

            if (! ($otpResult['valid'] ?? false)) {
                return ApiResponse::error(
                    $otpResult['message'] ?? 'Invalid OTP',
                    $otpResult['status'] ?? 422,
                    [],
                    array_diff_key($otpResult, ['valid' => true, 'message' => true, 'status' => true])
                );
            }
        }

        return DB::transaction(function () use ($user, $request): JsonResponse {
            $user->forceFill([
                'last_login_at' => now(),
                'failed_login_attempts' => 0,
                'account_locked_at' => null,
                'lock_reason' => null,
            ])->save();

            $this->recordLoginHistory($user, $request, 'success', $this->otps->isLoginOtpEnabled() ? 'otp' : 'password');

            $pair = $this->tokens->createPair($user, $request);

            return $this->responses->login(
                $pair['access_token'],
                $pair['refresh_token'],
                $this->userPayload($user),
                $this->roles($user),
                $pair['access_expires_at']->toIso8601String(),
                $pair['refresh_expires_at']->toIso8601String(),
                $pair['expires_in']
            );
        });
    }

    public function resendLoginOtp(string $identifier, ?string $password, Request $request): JsonResponse
    {
        $user = $this->findUser($identifier);

        if (! $user || ($password && ! Hash::check($password, $user->password_hash))) {
            return ApiResponse::error('Invalid credentials', 401);
        }

        if ($user->status !== 'active') {
            return ApiResponse::error('Account is '.$user->status, 403);
        }

        if (! $this->otps->isLoginOtpEnabled()) {
            return ApiResponse::success(
                ['otp_required' => false, 'requires_otp' => false],
                'OTP is not enabled',
                200,
                ['otp_required' => false, 'requires_otp' => false]
            );
        }

        $otpData = $this->otps->issue($user, $request);

        return ApiResponse::success(
            $this->otps->otpRequiredPayload($user, $identifier, $otpData),
            'OTP resent successfully',
            200,
            $this->otps->otpRequiredPayload($user, $identifier, $otpData)
        );
    }

    public function refresh(?string $refreshToken, Request $request): JsonResponse
    {
        if (! $refreshToken) {
            return ApiResponse::error('Invalid refresh token', 401);
        }

        return DB::transaction(function () use ($refreshToken, $request): JsonResponse {
            $result = $this->tokens->refresh($refreshToken, $request);

            if (! $result || ! ($result['user'] ?? null) instanceof User) {
                return ApiResponse::error('Invalid refresh token', 401);
            }

            /** @var User $user */
            $user = $result['user'];
            $this->recordLoginHistory($user, $request, 'success', 'refresh');

            return $this->responses->login(
                $result['access_token'],
                $result['refresh_token'],
                $this->userPayload($user),
                $this->roles($user),
                $result['access_expires_at']->toIso8601String(),
                $result['refresh_expires_at']->toIso8601String(),
                $result['expires_in'],
                'Token refreshed successfully'
            );
        });
    }

    public function logout(Request $request): JsonResponse
    {
        $accessToken = $request->bearerToken();

        if ($accessToken) {
            $this->tokens->revokePlainToken($accessToken, 'access', 'logout');
        }

        $refreshToken = $request->input('refresh_token') ?: $request->input('refreshToken');

        if (is_string($refreshToken) && trim($refreshToken) !== '') {
            $this->tokens->revokePlainToken(trim($refreshToken), 'refresh', 'logout');
        }

        $user = $request->user();
        if ($user instanceof User) {
            LoginHistory::query()
                ->where('user_id', $user->id)
                ->where('status', 'success')
                ->whereNull('logout_at')
                ->latest('login_at')
                ->limit(1)
                ->update([
                    'logout_at' => now(),
                    'updated_at' => now(),
                ]);
        }

        return ApiResponse::success([], 'Logout successful');
    }

    public function me(?User $user): JsonResponse
    {
        if (! $user) {
            return ApiResponse::unauthenticated('Unauthorized');
        }

        $payload = $this->userPayload($user);
        $roles = $this->roles($user);

        return ApiResponse::success(
            [
                'user' => $payload,
                'roles' => $roles,
            ],
            'User retrieved successfully',
            200,
            [
                'user' => $payload,
                'roles' => $roles,
            ]
        );
    }

    public function findUser(string $identifier): ?User
    {
        $normalized = mb_strtolower(trim($identifier), 'UTF-8');

        return User::query()
            ->with('roles', 'profile', 'contact', 'address', 'employment')
            ->where(function ($query) use ($normalized) {
                $query->whereRaw('LOWER(email) = ?', [$normalized])
                    ->orWhereRaw('LOWER(username) = ?', [$normalized]);
            })
            ->first();
    }

    private function userPayload(User $user): array
    {
        $user->loadMissing('roles', 'profile', 'contact', 'address', 'employment');

        return (new UserResource($user))->resolve();
    }

    private function roles(User $user): array
    {
        $user->loadMissing('roles');

        return $user->roles
            ->pluck('name')
            ->map(fn ($role) => strtolower((string) $role))
            ->values()
            ->all();
    }

    private function recordLoginHistory(
        User $user,
        Request $request,
        string $status,
        string $method,
        ?string $failureReason = null
    ): void {
        LoginHistory::create([
            'user_id' => $user->id,
            'login_at' => now(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'device_fingerprint' => $request->header('X-Device-Fingerprint'),
            'login_method' => $method,
            'status' => $status,
            'failure_reason' => $failureReason,
        ]);
    }
}
