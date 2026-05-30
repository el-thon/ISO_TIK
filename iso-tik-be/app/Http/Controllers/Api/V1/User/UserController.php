<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Api\V1\User\UserSearchRequest;
use App\Services\Api\V1\User\UserSearchService;
use Illuminate\Http\JsonResponse;

class UserController extends BaseApiController
{
    public function __construct(private readonly UserSearchService $users) {}

    public function index(UserSearchRequest $request): JsonResponse
    {
        return $this->users->index($request);
    }
}
