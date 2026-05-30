<?php
namespace App\Http\Requests\Api\V1\Admin\System;
use App\Http\Requests\Api\V1\BaseApiRequest;
class UpdateSystemSettingsRequest extends BaseApiRequest { public function rules(): array { return ['settings'=>['nullable','array'],'security.login_otp.enabled'=>['nullable']]; } }
