<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->name('api.v1.auth.login');
    Route::post('/login/otp/resend', [AuthController::class, 'resendLoginOtp'])->name('api.v1.auth.login.otp.resend');
    Route::post('/refresh', [AuthController::class, 'refresh'])->name('api.v1.auth.refresh');

    Route::middleware('api.token')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout'])->name('api.v1.auth.logout');
        Route::get('/me', [AuthController::class, 'me'])->name('api.v1.auth.me');
    });
});
