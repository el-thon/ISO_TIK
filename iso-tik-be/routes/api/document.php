<?php

use App\Http\Controllers\Api\V1\Content\DocumentController;
use Illuminate\Support\Facades\Route;

Route::middleware(['api.token'])->group(function () {
    Route::get('/documents', [DocumentController::class, 'index']);
    Route::post('/documents', [DocumentController::class, 'store']);
    Route::get('/documents/{documentId}/download-info', [DocumentController::class, 'downloadInfo']);
    Route::get('/documents/{documentId}/download', [DocumentController::class, 'download']);
    Route::get('/documents/{documentId}', [DocumentController::class, 'show']);
    Route::put('/documents/{documentId}', [DocumentController::class, 'update']);
    Route::delete('/documents/{documentId}', [DocumentController::class, 'destroy']);
});
