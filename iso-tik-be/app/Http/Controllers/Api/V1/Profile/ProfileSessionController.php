<?php

namespace App\Http\Controllers\Api\V1\Profile;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Api\V1\Profile\RevokeSessionRequest;
use App\Services\Api\V1\Profile\ProfileSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileSessionController extends BaseApiController
{
    public function __construct(private readonly ProfileSessionService $sessions) {}

    public function index(Request $request): JsonResponse
    {
        return $this->sessions->sessions($request->user(), $request);
    }

    public function destroy(RevokeSessionRequest $request, string $sessionId): JsonResponse
    {
        return $this->sessions->revoke($request->user(), $sessionId, $request);
    }

    public function destroyAll(RevokeSessionRequest $request): JsonResponse
    {
        return $this->sessions->revokeAll($request->user(), $request);
    }

    public function loginHistory(Request $request): JsonResponse
    {
        return $this->sessions->loginHistory($request->user(), $request);
    }
}
