<?php
namespace App\Http\Requests\Api\V1\Admin\User;
use App\Http\Requests\Api\V1\BaseApiRequest;
class AdminUserAssignRoleRequest extends BaseApiRequest { public function rules(): array { return ['role_id'=>['nullable','string'],'role'=>['nullable','string'],'reason'=>['nullable','string']]; } }
