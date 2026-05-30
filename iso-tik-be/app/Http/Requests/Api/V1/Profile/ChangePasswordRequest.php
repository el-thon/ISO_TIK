<?php

namespace App\Http\Requests\Api\V1\Profile;

use App\Http\Requests\Api\V1\BaseApiRequest;
use Illuminate\Validation\Validator;

class ChangePasswordRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'current_password' => ['nullable', 'string'],
            'old_password' => ['nullable', 'string'],
            'password' => ['nullable', 'string', 'min:8'],
            'new_password' => ['nullable', 'string', 'min:8'],
            'password_confirmation' => ['nullable', 'string'],
            'new_password_confirmation' => ['nullable', 'string'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if (! $this->input('current_password') && ! $this->input('old_password')) {
                    $validator->errors()->add('current_password', 'Current password is required.');
                }
                if (! $this->input('new_password') && ! $this->input('password')) {
                    $validator->errors()->add('new_password', 'New password is required.');
                }
            },
        ];
    }
}
