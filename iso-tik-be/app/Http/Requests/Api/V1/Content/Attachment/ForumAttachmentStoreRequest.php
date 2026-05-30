<?php

namespace App\Http\Requests\Api\V1\Content\Attachment;

use App\Http\Requests\Api\V1\BaseApiRequest;
use Illuminate\Contracts\Validation\Validator;

class ForumAttachmentStoreRequest extends BaseApiRequest
{
    public function rules(): array
    {
        $fileRule = ['nullable', 'file', 'max:20480', 'mimes:pdf,doc,docx,odt,rtf,txt,xls,xlsx,csv'];

        return [
            'file' => $fileRule,
            'attachment' => $fileRule,
            'document' => $fileRule,
            'evidence' => $fileRule,
            'upload' => $fileRule,
            'description' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'type' => ['nullable', 'string'],
            'topic_id' => ['nullable', 'string'],
            'input_item_id' => ['nullable', 'string'],
            'metadata' => ['nullable'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            foreach (['file', 'attachment', 'document', 'evidence', 'upload'] as $field) {
                if ($this->hasFile($field)) {
                    return;
                }
            }

            $validator->errors()->add('file', 'The file field is required.');
        });
    }
}
