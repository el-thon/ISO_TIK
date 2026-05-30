<?php

use App\Http\Controllers\Api\V1\Content\AttachmentDownloadController;
use App\Http\Controllers\Api\V1\Content\ForumAttachmentController;
use Illuminate\Support\Facades\Route;

Route::middleware(['api.token'])->group(function () {
    Route::get('/forums/{forumId}/attachments', [ForumAttachmentController::class, 'index']);
    Route::post('/forums/{forumId}/attachments', [ForumAttachmentController::class, 'store']);

    Route::get('/attachments/{attachmentId}/download-info', [AttachmentDownloadController::class, 'downloadInfo']);
    Route::get('/attachments/{attachmentId}/download', [AttachmentDownloadController::class, 'download']);
});
