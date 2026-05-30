<?php
namespace App\Http\Requests\Api\V1\Admin\User;
use App\Http\Requests\Api\V1\BaseApiRequest;
class AdminUserStoreRequest extends BaseApiRequest { public function rules(): array { return ['name'=>['nullable','string'],'email'=>['required','email','unique:pgsql.auth.users,email'],'username'=>['nullable','string','unique:pgsql.auth.users,username'],'password'=>['nullable','string','min:8'],'password_confirmation'=>['nullable','string'],'status'=>['nullable','in:active,inactive,suspended,locked'],'role_id'=>['nullable','string'],'role'=>['nullable','string'],'roles'=>['nullable','array'],'profile'=>['nullable','array'],'contact'=>['nullable','array'],'address'=>['nullable','array'],'employment'=>['nullable','array'],'full_name'=>['nullable','string']]; } }
