<?php

use App\Http\Controllers\Api\V1\Content\InputItemController;
use App\Http\Controllers\Api\V1\Content\TopicController;
use App\Http\Controllers\Api\V1\Content\TopicVersionController;
use App\Http\Controllers\Api\V1\Content\TopicWorkflowController;
use Illuminate\Support\Facades\Route;

Route::middleware('api.token')->group(function (): void {
    Route::get('/forums/{roomId}/topics', [TopicController::class, 'indexByForum']);
    Route::get('/topics', [TopicController::class, 'index']);
    Route::post('/forums/{forumId}/topics', [TopicController::class, 'store']);
    Route::get('/topics/{topicId}', [TopicController::class, 'show']);

    Route::get('/topics/{topicId}/input-items', [InputItemController::class, 'index']);
    Route::post('/topics/{topicId}/input-items', [InputItemController::class, 'store']);
    Route::put('/input-items/{inputItemId}', [InputItemController::class, 'update']);

    Route::post('/topics/{topicId}/publish', [TopicWorkflowController::class, 'publish']);
    Route::post('/topics/{topicId}/approve', [TopicWorkflowController::class, 'approve']);
    Route::post('/topics/{topicId}/request-changes', [TopicWorkflowController::class, 'requestChanges']);
    Route::post('/topics/{topicId}/close', [TopicWorkflowController::class, 'close']);
    Route::post('/topics/{topicId}/reopen', [TopicWorkflowController::class, 'reopen']);
    Route::post('/topics/{topicId}/freeze', [TopicWorkflowController::class, 'freeze']);
    Route::post('/topics/{topicId}/unfreeze', [TopicWorkflowController::class, 'unfreeze']);

    Route::get('/topics/{topicId}/versions', [TopicVersionController::class, 'index']);
    Route::post('/topics/{topicId}/versions/{versionId}/revert', [TopicVersionController::class, 'revert']);
});
