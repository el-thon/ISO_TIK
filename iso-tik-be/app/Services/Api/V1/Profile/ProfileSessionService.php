<?php

namespace App\Services\Api\V1\Profile;

use App\Http\Resources\Api\V1\Profile\LoginHistoryResource;
use App\Http\Resources\Api\V1\Profile\SessionResource;
use App\Models\Auth\LoginHistory;
use App\Models\Auth\SessionToken;
use App\Models\User;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileSessionService
{
    public function sessions(User $user, Request $request): JsonResponse
    {
        $currentHash = $request->bearerToken() ? hash('sha256', $request->bearerToken()) : null;
        $paginator = SessionToken::query()
            ->where('user_id', $user->id)
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now())
            ->latest()
            ->paginate((int) $request->integer('per_page', 15));

        $items = collect($paginator->items())
            ->map(function (SessionToken $session) use ($currentHash) {
                $session->setAttribute('is_current', $currentHash && $session->token_hash === $currentHash);
                return (new SessionResource($session))->resolve();
            })
            ->values()
            ->all();

        return $this->listResponse($items, $paginator, 'sessions', 'Sessions retrieved successfully');
    }

    public function revoke(User $user, string $sessionId, Request $request): JsonResponse
    {
        $session = SessionToken::query()
            ->where('user_id', $user->id)
            ->where('id', $sessionId)
            ->first();

        if (! $session) {
            return ApiResponse::notFound('Session not found');
        }

        $session->forceFill([
            'revoked_at' => now(),
            'revoke_reason' => $request->input('reason') ?: 'User revoked session',
        ])->save();

        return ApiResponse::success([], 'Session revoked successfully');
    }

    public function revokeAll(User $user, Request $request): JsonResponse
    {
        $currentHash = $request->bearerToken() ? hash('sha256', $request->bearerToken()) : null;

        SessionToken::query()
            ->where('user_id', $user->id)
            ->whereNull('revoked_at')
            ->when($currentHash, fn ($query) => $query->where('token_hash', '!=', $currentHash))
            ->update([
                'revoked_at' => now(),
                'revoke_reason' => $request->input('reason') ?: 'User revoked all sessions',
                'updated_at' => now(),
            ]);

        return ApiResponse::success([], 'All sessions revoked successfully');
    }

    public function loginHistory(User $user, Request $request): JsonResponse
    {
        $paginator = LoginHistory::query()
            ->where('user_id', $user->id)
            ->latest('login_at')
            ->paginate((int) $request->integer('per_page', 15));

        $items = collect($paginator->items())
            ->map(fn (LoginHistory $history) => (new LoginHistoryResource($history))->resolve())
            ->values()
            ->all();

        $pagination = $this->pagination($paginator);

        return response()->json([
            'success' => true,
            'message' => 'Login history retrieved successfully',
            'data' => [
                'login_history' => $items,
                'histories' => $items,
                'items' => $items,
                'data' => $items,
                ...$pagination,
            ],
            'login_history' => $items,
            'histories' => $items,
            'items' => $items,
            'meta' => $pagination,
            'pagination' => $pagination,
        ]);
    }

    private function listResponse(array $items, $paginator, string $key, string $message): JsonResponse
    {
        $pagination = $this->pagination($paginator);

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                $key => $items,
                'items' => $items,
                'data' => $items,
                ...$pagination,
            ],
            $key => $items,
            'items' => $items,
            'meta' => $pagination,
            'pagination' => $pagination,
        ]);
    }

    private function pagination($paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'last_page' => $paginator->lastPage(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
            'path' => $paginator->path(),
            'prev_page_url' => $paginator->previousPageUrl(),
            'next_page_url' => $paginator->nextPageUrl(),
        ];
    }
}
