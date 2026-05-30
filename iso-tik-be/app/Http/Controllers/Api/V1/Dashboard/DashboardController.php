<?php

namespace App\Http\Controllers\Api\V1\Dashboard;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Api\V1\Dashboard\DashboardStatisticsRequest;
use App\Services\Api\V1\Dashboard\DashboardStatisticsService;

class DashboardController extends BaseApiController
{
    public function __construct(private readonly DashboardStatisticsService $statistics) {}

    public function statistics(DashboardStatisticsRequest $request)
    {
        return $this->statistics->handle($request);
    }
}
