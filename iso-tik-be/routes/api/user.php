<?php

use App\Http\Controllers\Api\V1\Profile\ProfileSignatureController;
use App\Http\Controllers\Api\V1\User\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('api.token')->group(function () {
    Route::get('/users', [UserController::class, 'index'])->name('api.v1.users.index');
    Route::get('/users/{userId}/signature/download', [ProfileSignatureController::class, 'downloadUserSignature'])
        ->name('api.v1.users.signature.download');
});
