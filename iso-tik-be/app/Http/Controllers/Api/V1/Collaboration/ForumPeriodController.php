<?php

namespace App\Http\Controllers\Api\V1\Collaboration;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Api\V1\Collaboration\Period\JoinPeriodRequest;
use App\Http\Requests\Api\V1\Collaboration\Period\JoinRequestIndexRequest;
use App\Http\Requests\Api\V1\Collaboration\Period\PeriodIndexRequest;
use App\Http\Requests\Api\V1\Collaboration\Period\PeriodStoreRequest;
use App\Http\Requests\Api\V1\Collaboration\Period\PeriodUpdateRequest;
use App\Services\Api\V1\Collaboration\ForumPeriodJoinRequestService;
use App\Services\Api\V1\Collaboration\ForumPeriodService;
use Illuminate\Http\Request;

class ForumPeriodController extends BaseApiController
{
    public function __construct(private readonly ForumPeriodService $periods, private readonly ForumPeriodJoinRequestService $joinRequests) {}

    public function index(PeriodIndexRequest $request) { return $this->periods->index($request); }
    public function store(PeriodStoreRequest $request) { return $this->periods->store($request->validated(), $request); }
    public function show(string $periodId, Request $request) { return $this->periods->show($periodId, $request); }
    public function update(string $periodId, PeriodUpdateRequest $request) { return $this->periods->update($periodId, $request->validated(), $request); }
    public function join(JoinPeriodRequest $request) { return $this->periods->join($request->validated(), $request); }
    public function joinRequests(string $periodId, JoinRequestIndexRequest $request) { return $this->joinRequests->index($periodId, $request); }
    public function approveJoinRequest(string $periodId, string $joinRequestId, Request $request) { return $this->joinRequests->approve($periodId, $joinRequestId, $request); }
}
