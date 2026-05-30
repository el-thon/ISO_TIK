<?php

namespace App\Http\Requests\Api\V1\Content\Document;

use App\Http\Requests\Api\V1\BaseApiRequest;
use Illuminate\Validation\Validator;

class DocumentStoreRequest extends BaseApiRequest
{
    public function rules(): array
    {
        $fileRule = ['nullable', 'file', 'max:20480', 'mimes:pdf,doc,docx,odt,rtf,txt,xls,xlsx,csv'];

        return [
            'file' => $fileRule,
            'document' => $fileRule,
            'attachment' => $fileRule,
            'upload' => $fileRule,
            'title' => ['nullable', 'string', 'max:255'],
            'name' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'document_number' => ['nullable', 'string', 'max:255'],
            'revision_number' => ['nullable', 'string', 'max:100'],
            'document_type' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'max:100'],
            'is_active' => ['nullable'],
            'topic_id' => ['nullable', 'string'],
            'forum_id' => ['nullable', 'string'],
            'topic_document_master_id' => ['nullable', 'string'],
            'metadata' => ['nullable'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                foreach (['file', 'document', 'attachment', 'upload'] as $field) {
                    if ($this->hasFile($field)) {
                        return;
                    }
                }

                $validator->errors()->add('file', 'The file field is required.');
            },
        ];
    }
}
