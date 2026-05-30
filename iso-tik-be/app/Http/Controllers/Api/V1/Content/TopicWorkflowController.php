<?php

namespace App\Http\Controllers\Api\V1\Content;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Api\V1\Content\Topic\TopicFreezeRequest;
use App\Http\Requests\Api\V1\Content\Topic\TopicWorkflowActionRequest;
use App\Services\Api\V1\Content\TopicWorkflowService;

class TopicWorkflowController extends BaseApiController
{
    public function __construct(private readonly TopicWorkflowService $workflow) {}
    public function publish(string $topicId, TopicWorkflowActionRequest $request) { return $this->workflow->transition($topicId, 'in_review', $request); }
    public function approve(string $topicId, TopicWorkflowActionRequest $request) { return $this->workflow->transition($topicId, 'approved', $request); }
    public function requestChanges(string $topicId, TopicWorkflowActionRequest $request) { return $this->workflow->transition($topicId, 'changes_requested', $request); }
    public function close(string $topicId, TopicWorkflowActionRequest $request) { return $this->workflow->transition($topicId, 'closed', $request); }
    public function reopen(string $topicId, TopicWorkflowActionRequest $request) { return $this->workflow->transition($topicId, 'draft', $request); }
    public function freeze(string $topicId, TopicFreezeRequest $request) { return $this->workflow->transition($topicId, 'frozen', $request); }
    public function unfreeze(string $topicId, TopicFreezeRequest $request) { return $this->workflow->transition($topicId, 'unfreeze', $request); }
}
