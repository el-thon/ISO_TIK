<?php

namespace App\Http\Requests\Api\V1\Content\Document;

use App\Http\Requests\Api\V1\BaseApiRequest;

class DocumentIndexRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'search' => ['nullable', 'string'],
            'q' => ['nullable', 'string'],
            'keyword' => ['nullable', 'string'],
            'status' => ['nullable', 'string'],
            'is_active' => ['nullable'],
            'document_type' => ['nullable', 'string'],
            'topic_id' => ['nullable', 'string'],
            'forum_id' => ['nullable', 'string'],
            'master_id' => ['nullable', 'string'],
            'topic_document_master_id' => ['nullable', 'string'],
        ];
    }
}
