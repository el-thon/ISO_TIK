<?php

namespace App\Http\Requests\Api\V1\Auth;

use App\Http\Requests\Api\V1\BaseApiRequest;
use Illuminate\Validation\Validator;

class LoginRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'login' => ['nullable', 'string'],
            'username' => ['nullable', 'string'],
            'email' => ['nullable', 'string'],
            'password' => ['required', 'string'],
            'otp' => ['nullable', 'string'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if (! $this->filled('login') && ! $this->filled('username') && ! $this->filled('email')) {
                    $validator->errors()->add('login', 'Login, username, or email is required.');
                }
            },
        ];
    }

    public function identifier(): string
    {
        return trim((string) ($this->input('login') ?: $this->input('username') ?: $this->input('email')));
    }
}
