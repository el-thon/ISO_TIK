<?php

use App\Http\Controllers\Api\V1\Collaboration\ForumController;
use App\Http\Controllers\Api\V1\Collaboration\ForumPeriodController;
use Illuminate\Support\Facades\Route;

Route::middleware('api.token')->group(function (): void {
    Route::get('/period', [ForumPeriodController::class, 'index']);
    Route::post('/period', [ForumPeriodController::class, 'store']);
    Route::post('/period/join', [ForumPeriodController::class, 'join']);
    Route::get('/period/{periodId}', [ForumPeriodController::class, 'show']);
    Route::put('/period/{periodId}', [ForumPeriodController::class, 'update']);

    Route::get('/period/{periodId}/join-requests', [ForumPeriodController::class, 'joinRequests']);
    Route::post('/period/{periodId}/join-requests/{joinRequestId}/approve', [ForumPeriodController::class, 'approveJoinRequest']);

    Route::get('/period/{periodId}/forums', [ForumController::class, 'indexByPeriod']);
    Route::post('/period/{periodId}/forums', [ForumController::class, 'storeByPeriod'])->middleware('role:admin');
});
