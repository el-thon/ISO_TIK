<?php

namespace App\Support\Api;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Contracts\Pagination\Paginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;

class ApiResponse
{
    public static function success(
        mixed $data = [],
        string $message = 'Success',
        int $status = 200,
        array $extra = [],
        array $meta = []
    ): JsonResponse {
        $payload = [
            'success' => true,
            'message' => $message,
            'data' => $data,
        ];

        if ($meta !== []) {
            $payload['meta'] = $meta;
        }

        return response()->json(array_merge($payload, $extra), $status);
    }

    public static function error(
        string $message = 'Error',
        int $status = 400,
        array $errors = [],
        array $extra = []
    ): JsonResponse {
        $payload = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== []) {
            $payload['errors'] = $errors;
        }

        return response()->json(array_merge($payload, $extra), $status);
    }

    public static function validationError(array $errors, string $message = 'Validation failed'): JsonResponse
    {
        return self::error($message, 422, $errors);
    }

    public static function unauthenticated(string $message = 'Unauthenticated'): JsonResponse
    {
        return self::error($message, 401);
    }

    public static function forbidden(string $message = 'Forbidden'): JsonResponse
    {
        return self::error($message, 403);
    }

    public static function notFound(string $message = 'Data not found'): JsonResponse
    {
        return self::error($message, 404);
    }

    public static function paginated(
        LengthAwarePaginator|Paginator $paginator,
        string $key = 'items',
        string $message = 'Data retrieved successfully'
    ): JsonResponse {
        $items = $paginator->items();
        $pagination = [
            'current_page' => method_exists($paginator, 'currentPage') ? $paginator->currentPage() : 1,
            'per_page' => method_exists($paginator, 'perPage') ? $paginator->perPage() : count($items),
            'from' => method_exists($paginator, 'firstItem') ? $paginator->firstItem() : null,
            'to' => method_exists($paginator, 'lastItem') ? $paginator->lastItem() : null,
        ];

        if ($paginator instanceof LengthAwarePaginator) {
            $pagination['total'] = $paginator->total();
            $pagination['last_page'] = $paginator->lastPage();
        } else {
            $pagination['total'] = count($items);
            $pagination['last_page'] = $pagination['current_page'];
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                $key => $items,
                'items' => $items,
            ],
            $key => $items,
            'items' => $items,
            'meta' => $pagination,
            'pagination' => $pagination,
        ]);
    }

    public static function token(
        array $tokens,
        array|JsonResource|null $user = null,
        array $roles = [],
        string $message = 'Login successful'
    ): JsonResponse {
        $data = array_merge($tokens, [
            'token_type' => $tokens['token_type'] ?? 'Bearer',
            'user' => $user,
            'roles' => $roles,
        ]);

        return self::success($data, $message, 200, $data);
    }
}
