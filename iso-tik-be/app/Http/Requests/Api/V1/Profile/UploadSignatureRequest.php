<?php

namespace App\Http\Requests\Api\V1\Profile;

use App\Http\Requests\Api\V1\BaseApiRequest;
use Illuminate\Validation\Validator;

class UploadSignatureRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'file' => ['nullable', 'file', 'mimes:jpeg,jpg,png', 'max:2048'],
            'signature' => ['nullable', 'file', 'mimes:jpeg,jpg,png', 'max:2048'],
            'image' => ['nullable', 'file', 'mimes:jpeg,jpg,png', 'max:2048'],
            'notes' => ['nullable', 'string'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if (! $this->file('file') && ! $this->file('signature') && ! $this->file('image')) {
                    $validator->errors()->add('file', 'Signature file is required.');
                }
            },
        ];
    }
}
