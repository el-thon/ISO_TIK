<?php

namespace App\Http\Controllers\Api\V1\Collaboration;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Api\V1\Collaboration\Forum\ForumParticipantIndexRequest;
use App\Http\Requests\Api\V1\Collaboration\Forum\ForumParticipantStoreRequest;
use App\Http\Requests\Api\V1\Collaboration\Forum\ForumParticipantUpdateRequest;
use App\Services\Api\V1\Collaboration\ForumParticipantService;
use Illuminate\Http\Request;

class ForumParticipantController extends BaseApiController
{
    public function __construct(private readonly ForumParticipantService $participants) {}

    public function index(string $roomId, ForumParticipantIndexRequest $request) { return $this->participants->index($roomId, $request); }
    public function store(string $roomId, ForumParticipantStoreRequest $request) { return $this->participants->store($roomId, $request->validated(), $request); }
    public function update(string $roomId, string $participantId, ForumParticipantUpdateRequest $request) { return $this->participants->update($roomId, $participantId, $request->validated(), $request); }
    public function destroy(string $roomId, string $participantId, Request $request) { return $this->participants->destroy($roomId, $participantId, $request); }
    public function leave(string $roomId, Request $request) { return $this->participants->leave($roomId, $request); }
}
