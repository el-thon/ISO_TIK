<?php

use App\Http\Controllers\Api\V1\Dashboard\DashboardController;
use Illuminate\Support\Facades\Route;

Route::middleware(['api.token'])->group(function () {
    Route::get('/dashboard/statistics', [DashboardController::class, 'statistics']);
});
