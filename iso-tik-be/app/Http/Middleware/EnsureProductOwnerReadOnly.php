<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EnsureProductOwnerReadOnly
{
    public function denyIfWriteAction(Request $request, User $user): ?JsonResponse
    {
        if (! $user->hasRole('product_owner') || $this->isReadMethod($request) || $this->isAllowedSelfServiceRoute($request)) {
            return null;
        }

        return ApiResponse::forbidden('Product owner has read-only access');
    }

    private function isReadMethod(Request $request): bool
    {
        return in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true);
    }

    private function isAllowedSelfServiceRoute(Request $request): bool
    {
        $path = trim($request->path(), '/');

        if ($request->isMethod('POST') && in_array($path, ['api/v1/auth/logout', 'v1/auth/logout'], true)) {
            return true;
        }

        return $this->matches($path, [
            'api/v1/profile',
            'api/v1/profile/employment',
            'api/v1/profile/change-password',
            'api/v1/profile/photo',
            'api/v1/profile/signature',
            'api/v1/profile/sessions/*',
            'api/v1/profile/sessions/all',
            'api/v1/profile/security/sessions',
            'api/v1/profile/security/sessions/*',
            'v1/profile',
            'v1/profile/employment',
            'v1/profile/change-password',
            'v1/profile/photo',
            'v1/profile/signature',
            'v1/profile/sessions/*',
            'v1/profile/sessions/all',
            'v1/profile/security/sessions',
            'v1/profile/security/sessions/*',
        ]);
    }

    private function matches(string $path, array $patterns): bool
    {
        foreach ($patterns as $pattern) {
            if ($path === $pattern || fnmatch($pattern, $path)) {
                return true;
            }
        }

        return false;
    }
}
