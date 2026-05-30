<?php

namespace App\Http\Middleware;

use App\Models\Auth\SessionToken;
use App\Support\Api\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class ApiTokenMiddleware
{
    public function __construct(private readonly EnsureProductOwnerReadOnly $productOwnerReadOnly) {}

    public function handle(Request $request, Closure $next): Response
    {
        $plainToken = $request->bearerToken();

        if (! $plainToken) {
            return ApiResponse::unauthenticated('Unauthorized');
        }

        $sessionToken = SessionToken::query()
            ->with('user.roles')
            ->active()
            ->where('token_type', 'access')
            ->where('token_hash', hash('sha256', $plainToken))
            ->first();

        if (! $sessionToken || ! $sessionToken->user || $sessionToken->user->status !== 'active' || $sessionToken->user->account_locked_at !== null) {
            return ApiResponse::unauthenticated('Unauthorized');
        }

        Auth::setUser($sessionToken->user);

        if ($response = $this->productOwnerReadOnly->denyIfWriteAction($request, $sessionToken->user)) {
            return $response;
        }

        return $next($request);
    }
}
