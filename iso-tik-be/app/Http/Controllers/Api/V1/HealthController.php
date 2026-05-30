<?php

namespace App\Http\Controllers\Api\V1;

use App\Support\Api\ApiResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class HealthController extends BaseApiController
{
    public function __invoke()
    {
        try {
            DB::connection()->getPdo();

            return ApiResponse::success(
                [
                    'app' => 'ok',
                    'database' => 'connected',
                ],
                'API is healthy',
                200,
                [
                    'status' => 'ok',
                    'database' => 'ok',
                    'service' => config('app.name'),
                ]
            );
        } catch (Throwable $exception) {
            return ApiResponse::error(
                app()->hasDebugModeEnabled() ? $exception->getMessage() : 'Database connection failed',
                503,
                [],
                [
                    'status' => 'error',
                    'database' => 'unavailable',
                    'service' => config('app.name'),
                ]
            );
        }
    }
}
