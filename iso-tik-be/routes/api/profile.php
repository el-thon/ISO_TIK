<?php

use App\Http\Controllers\Api\V1\Profile\ProfileController;
use App\Http\Controllers\Api\V1\Profile\ProfileSessionController;
use App\Http\Controllers\Api\V1\Profile\ProfileSignatureController;
use Illuminate\Support\Facades\Route;

Route::middleware('api.token')->group(function () {
    Route::get('/profile', [ProfileController::class, 'show'])->name('api.v1.profile.show');
    Route::put('/profile', [ProfileController::class, 'update'])->name('api.v1.profile.update');
    Route::put('/profile/employment', [ProfileController::class, 'updateEmployment'])->name('api.v1.profile.employment.update');
    Route::post('/profile/change-password', [ProfileController::class, 'changePassword'])->name('api.v1.profile.password.change');
    Route::post('/profile/photo', [ProfileController::class, 'uploadPhoto'])->name('api.v1.profile.photo.upload');
    Route::delete('/profile/photo', [ProfileController::class, 'deletePhoto'])->name('api.v1.profile.photo.delete');

    Route::get('/profile/sessions', [ProfileSessionController::class, 'index'])->name('api.v1.profile.sessions.index');
    Route::delete('/profile/sessions/all', [ProfileSessionController::class, 'destroyAll'])->name('api.v1.profile.sessions.destroy-all');
    Route::delete('/profile/sessions/{sessionId}', [ProfileSessionController::class, 'destroy'])->name('api.v1.profile.sessions.destroy');
    Route::get('/profile/login-history', [ProfileSessionController::class, 'loginHistory'])->name('api.v1.profile.login-history');

    Route::get('/profile/security/sessions', [ProfileSessionController::class, 'index'])->name('api.v1.profile.security.sessions.index');
    Route::delete('/profile/security/sessions', [ProfileSessionController::class, 'destroyAll'])->name('api.v1.profile.security.sessions.destroy-all');
    Route::delete('/profile/security/sessions/{sessionId}', [ProfileSessionController::class, 'destroy'])->name('api.v1.profile.security.sessions.destroy');
    Route::get('/profile/security/login-history', [ProfileSessionController::class, 'loginHistory'])->name('api.v1.profile.security.login-history');

    Route::get('/profile/signature', [ProfileSignatureController::class, 'show'])->name('api.v1.profile.signature.show');
    Route::post('/profile/signature', [ProfileSignatureController::class, 'store'])->name('api.v1.profile.signature.store');
    Route::delete('/profile/signature', [ProfileSignatureController::class, 'destroy'])->name('api.v1.profile.signature.destroy');
    Route::get('/profile/signature/download', [ProfileSignatureController::class, 'download'])->name('api.v1.profile.signature.download');
});
