<?php

namespace App\Services\Api\V1\Auth;

use App\Models\Auth\SessionToken;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TokenService
{
    public const ACCESS_TTL_MINUTES = 60;

    public const REFRESH_TTL_MINUTES = 60 * 24 * 7;

    public function createPair(User $user, Request $request): array
    {
        $accessToken = $this->generatePlainToken();
        $refreshToken = $this->generatePlainToken();
        $accessExpiresAt = now()->addMinutes(self::ACCESS_TTL_MINUTES);
        $refreshExpiresAt = now()->addMinutes(self::REFRESH_TTL_MINUTES);

        $this->storeToken($user, $accessToken, 'access', $accessExpiresAt, $request);
        $this->storeToken($user, $refreshToken, 'refresh', $refreshExpiresAt, $request);

        return [
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'access_expires_at' => $accessExpiresAt,
            'refresh_expires_at' => $refreshExpiresAt,
            'expires_in' => self::ACCESS_TTL_MINUTES * 60,
            'token_type' => 'Bearer',
        ];
    }

    public function refresh(string $refreshToken, Request $request): ?array
    {
        $session = $this->findByPlainToken($refreshToken, 'refresh');

        if (! $session || ! $this->canUseTokens($session->user)) {
            return null;
        }

        $pair = $this->createPair($session->user, $request);
        $this->revoke($session, 'rotated');

        return array_merge($pair, ['user' => $session->user]);
    }

    public function findByPlainToken(string $plainToken, string $type = 'access'): ?SessionToken
    {
        return SessionToken::query()
            ->with('user.roles', 'user.profile', 'user.contact', 'user.address', 'user.employment')
            ->active()
            ->where('token_type', $type)
            ->where('token_hash', $this->hashToken($plainToken))
            ->first();
    }

    public function userFromBearer(?string $plainToken): ?User
    {
        if (! $plainToken) {
            return null;
        }

        $session = $this->findByPlainToken($plainToken, 'access');

        if (! $session || ! $this->canUseTokens($session->user)) {
            return null;
        }

        return $session->user;
    }

    public function revokePlainToken(?string $plainToken, string $type = 'access', string $reason = 'logout'): void
    {
        if (! $plainToken) {
            return;
        }

        $session = $this->findByPlainToken($plainToken, $type);

        if ($session) {
            $this->revoke($session, $reason);
        }
    }

    public function revoke(SessionToken $sessionToken, string $reason): void
    {
        $sessionToken->forceFill([
            'revoked_at' => now(),
            'revoke_reason' => $reason,
        ])->save();
    }

    public function hashToken(string $plainToken): string
    {
        return hash('sha256', $plainToken);
    }

    private function generatePlainToken(): string
    {
        return Str::random(80);
    }

    private function canUseTokens(?User $user): bool
    {
        return $user !== null && $user->status === 'active' && $user->account_locked_at === null;
    }

    private function storeToken(User $user, string $plainToken, string $type, $expiresAt, Request $request): SessionToken
    {
        return SessionToken::create([
            'user_id' => $user->id,
            'token_hash' => $this->hashToken($plainToken),
            'token_type' => $type,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'device_fingerprint' => $request->header('X-Device-Fingerprint'),
            'expires_at' => $expiresAt,
        ]);
    }
}
