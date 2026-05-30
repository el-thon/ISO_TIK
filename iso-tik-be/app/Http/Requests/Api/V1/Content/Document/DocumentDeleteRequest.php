<?php

namespace App\Http\Requests\Api\V1\Content\Document;

use App\Http\Requests\Api\V1\BaseApiRequest;

class DocumentDeleteRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'reason' => ['nullable', 'string', 'max:500'],
        ];
    }
}
