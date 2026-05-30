<?php

namespace App\Http\Controllers\Api\V1\Content;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Api\V1\Content\Topic\TopicVersionIndexRequest;
use App\Http\Requests\Api\V1\Content\Topic\TopicVersionRevertRequest;
use App\Services\Api\V1\Content\TopicVersionService;

class TopicVersionController extends BaseApiController
{
    public function __construct(private readonly TopicVersionService $versions) {}
    public function index(string $topicId, TopicVersionIndexRequest $request) { return $this->versions->index($topicId, $request); }
    public function revert(string $topicId, string $versionId, TopicVersionRevertRequest $request) { return $this->versions->revert($topicId, $versionId, $request); }
}
