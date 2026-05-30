<?php

use App\Http\Controllers\Api\V1\HealthController;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class)->name('api.v1.health');

foreach ([
    'auth',
    'user',
    'profile',
    'admin',
    'period',
    'forum',
    'topic',
    'attachment',
    'document',
    'dashboard',
] as $routeFile) {
    require __DIR__.'/'.$routeFile.'.php';
}
