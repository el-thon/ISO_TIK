<?php

namespace App\Http\Controllers\Api\V1\Collaboration;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Api\V1\Collaboration\Forum\ForumIndexRequest;
use App\Http\Requests\Api\V1\Collaboration\Forum\ForumStoreRequest;
use App\Http\Requests\Api\V1\Collaboration\Forum\ForumUpdateRequest;
use App\Http\Requests\Api\V1\Collaboration\Forum\JoinForumRequest;
use App\Services\Api\V1\Collaboration\ForumService;
use Illuminate\Http\Request;

class ForumController extends BaseApiController
{
    public function __construct(private readonly ForumService $forums) {}

    public function index(ForumIndexRequest $request) { return $this->forums->index($request); }
    public function indexByPeriod(string $periodId, ForumIndexRequest $request) { return $this->forums->index($request, $periodId); }
    public function storeByPeriod(string $periodId, ForumStoreRequest $request) { return $this->forums->store($periodId, $request->validated(), $request); }
    public function show(string $roomId, Request $request) { return $this->forums->show($roomId, $request); }
    public function update(string $roomId, ForumUpdateRequest $request) { return $this->forums->update($roomId, $request->validated(), $request); }
    public function destroy(string $roomId, Request $request) { return $this->forums->destroy($roomId, $request); }
    public function join(JoinForumRequest $request) { return $this->forums->join($request->validated(), $request); }
    public function lock(string $roomId, Request $request) { return $this->forums->setState($roomId, 'lock', $request); }
    public function unlock(string $roomId, Request $request) { return $this->forums->setState($roomId, 'unlock', $request); }
    public function archive(string $roomId, Request $request) { return $this->forums->setState($roomId, 'archive', $request); }
    public function restore(string $roomId, Request $request) { return $this->forums->setState($roomId, 'restore', $request); }
}
