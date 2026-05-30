<?php
namespace App\Http\Requests\Api\V1\Admin\User;
use App\Http\Requests\Api\V1\BaseApiRequest;
class AdminUserIndexRequest extends BaseApiRequest { public function rules(): array { return ['page'=>['nullable','integer'],'per_page'=>['nullable','integer','max:100'],'search'=>['nullable','string'],'q'=>['nullable','string'],'keyword'=>['nullable','string'],'status'=>['nullable','string'],'role'=>['nullable','string'],'sort'=>['nullable','string'],'direction'=>['nullable','string'],'include_deleted'=>['nullable'],'trashed'=>['nullable']]; } }
