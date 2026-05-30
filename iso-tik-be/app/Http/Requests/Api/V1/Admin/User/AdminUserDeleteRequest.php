<?php
namespace App\Http\Requests\Api\V1\Admin\User;
use App\Http\Requests\Api\V1\BaseApiRequest;
class AdminUserDeleteRequest extends BaseApiRequest { public function rules(): array { return ['reason'=>['nullable','string']]; } }
