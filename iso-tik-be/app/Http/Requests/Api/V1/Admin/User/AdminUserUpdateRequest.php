<?php
namespace App\Http\Requests\Api\V1\Admin\User;
use App\Http\Requests\Api\V1\BaseApiRequest;
class AdminUserUpdateRequest extends BaseApiRequest { public function rules(): array { return ['name'=>['nullable','string'],'email'=>['nullable','email'],'username'=>['nullable','string'],'password'=>['nullable','string','min:8'],'status'=>['nullable','in:active,inactive,suspended,locked'],'photo_url'=>['nullable','string'],'role_id'=>['nullable','string'],'role'=>['nullable','string'],'roles'=>['nullable','array'],'profile'=>['nullable','array'],'contact'=>['nullable','array'],'address'=>['nullable','array'],'employment'=>['nullable','array'],'full_name'=>['nullable','string']]; } }
