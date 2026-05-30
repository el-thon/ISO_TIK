<?php

namespace App\Http\Requests\Api\V1\Profile;

use App\Http\Requests\Api\V1\BaseApiRequest;
use Illuminate\Validation\Validator;

class UploadProfilePhotoRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'photo' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
            'image' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
            'file' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if (! $this->file('photo') && ! $this->file('image') && ! $this->file('file')) {
                    $validator->errors()->add('photo', 'Profile photo file is required.');
                }
            },
        ];
    }
}
