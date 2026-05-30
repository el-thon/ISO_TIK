<?php
namespace App\Http\Requests\Api\V1\Admin\User;
use App\Http\Requests\Api\V1\BaseApiRequest;
class AdminUserResetPasswordRequest extends BaseApiRequest { public function rules(): array { return ['password'=>['nullable','string','min:8'],'new_password'=>['nullable','string','min:8'],'password_confirmation'=>['nullable','string'],'new_password_confirmation'=>['nullable','string']]; } }
