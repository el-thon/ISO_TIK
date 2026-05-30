<?php

namespace App\Http\Controllers\Api\V1\Content;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Api\V1\Content\Attachment\ForumAttachmentIndexRequest;
use App\Http\Requests\Api\V1\Content\Attachment\ForumAttachmentStoreRequest;
use App\Services\Api\V1\Content\AttachmentService;

class ForumAttachmentController extends BaseApiController
{
    public function __construct(private readonly AttachmentService $attachments) {}

    public function index(string $forumId, ForumAttachmentIndexRequest $request)
    {
        return $this->attachments->index($forumId, $request);
    }

    public function store(string $forumId, ForumAttachmentStoreRequest $request)
    {
        return $this->attachments->store($forumId, $request->validated(), $request);
    }
}
