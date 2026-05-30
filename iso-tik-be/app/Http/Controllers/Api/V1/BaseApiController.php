<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\Api\ApiResponse;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Contracts\Pagination\Paginator;
use Illuminate\Http\JsonResponse;

abstract class BaseApiController extends Controller
{
    protected function success(
        mixed $data = [],
        string $message = 'Success',
        int $status = 200,
        array $extra = [],
        array $meta = []
    ): JsonResponse {
        return ApiResponse::success($data, $message, $status, $extra, $meta);
    }

    protected function error(string $message = 'Error', int $status = 400, array $errors = []): JsonResponse
    {
        return ApiResponse::error($message, $status, $errors);
    }

    protected function paginated(
        LengthAwarePaginator|Paginator $paginator,
        string $key = 'items',
        string $message = 'Data retrieved successfully'
    ): JsonResponse {
        return ApiResponse::paginated($paginator, $key, $message);
    }
}
