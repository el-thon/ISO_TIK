<?php

namespace App\Http\Controllers\Api\V1\Content;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Services\Api\V1\Content\AttachmentService;
use Illuminate\Http\Request;

class AttachmentDownloadController extends BaseApiController
{
    public function __construct(private readonly AttachmentService $attachments) {}

    public function downloadInfo(string $attachmentId, Request $request)
    {
        return $this->attachments->downloadInfo($attachmentId, $request);
    }

    public function download(string $attachmentId, Request $request)
    {
        return $this->attachments->download($attachmentId, $request);
    }
}
