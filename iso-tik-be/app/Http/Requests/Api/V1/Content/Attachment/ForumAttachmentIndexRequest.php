<?php

namespace App\Http\Requests\Api\V1\Content\Attachment;

use App\Http\Requests\Api\V1\BaseApiRequest;

class ForumAttachmentIndexRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'search' => ['nullable', 'string'],
            'q' => ['nullable', 'string'],
            'keyword' => ['nullable', 'string'],
            'type' => ['nullable', 'string'],
            'mime_type' => ['nullable', 'string'],
            'uploaded_by' => ['nullable', 'string'],
            'topic_id' => ['nullable', 'string'],
            'input_item_id' => ['nullable', 'string'],
        ];
    }
}
