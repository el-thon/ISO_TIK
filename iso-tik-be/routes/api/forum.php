<?php

use App\Http\Controllers\Api\V1\Collaboration\ForumController;
use App\Http\Controllers\Api\V1\Collaboration\ForumParticipantController;
use Illuminate\Support\Facades\Route;

Route::middleware('api.token')->group(function (): void {
    Route::get('/forums', [ForumController::class, 'index']);
    Route::post('/forums/join', [ForumController::class, 'join']);

    Route::get('/forums/{roomId}', [ForumController::class, 'show']);
    Route::put('/forums/{roomId}', [ForumController::class, 'update'])->middleware('role:admin');
    Route::delete('/forums/{roomId}', [ForumController::class, 'destroy'])->middleware('role:admin');

    Route::post('/forums/{roomId}/lock', [ForumController::class, 'lock'])->middleware('role:admin');
    Route::post('/forums/{roomId}/unlock', [ForumController::class, 'unlock'])->middleware('role:admin');
    Route::post('/forums/{roomId}/archive', [ForumController::class, 'archive'])->middleware('role:admin');
    Route::post('/forums/{roomId}/restore', [ForumController::class, 'restore'])->middleware('role:admin');

    Route::get('/forums/{roomId}/participants', [ForumParticipantController::class, 'index']);
    Route::post('/forums/{roomId}/participants', [ForumParticipantController::class, 'store']);
    Route::put('/forums/{roomId}/participants/{participantId}', [ForumParticipantController::class, 'update']);
    Route::delete('/forums/{roomId}/participants/{participantId}', [ForumParticipantController::class, 'destroy']);
    Route::post('/forums/{roomId}/leave', [ForumParticipantController::class, 'leave']);
});
