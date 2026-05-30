<?php

namespace App\Http\Controllers\Api\V1\Content;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Api\V1\Content\Topic\TopicIndexRequest;
use App\Http\Requests\Api\V1\Content\Topic\TopicStoreRequest;
use App\Services\Api\V1\Content\TopicService;
use Illuminate\Http\Request;

class TopicController extends BaseApiController
{
    public function __construct(private readonly TopicService $topics) {}
    public function indexByForum(string $roomId, TopicIndexRequest $request) { return $this->topics->index($request, $roomId); }
    public function index(TopicIndexRequest $request) { return $this->topics->index($request); }
    public function store(string $forumId, TopicStoreRequest $request) { return $this->topics->store($forumId, $request->validated(), $request); }
    public function show(string $topicId, Request $request) { return $this->topics->show($topicId, $request); }
}
