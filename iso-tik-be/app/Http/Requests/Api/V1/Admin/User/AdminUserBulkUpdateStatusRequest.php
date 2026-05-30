<?php
namespace App\Http\Requests\Api\V1\Admin\User;
use App\Http\Requests\Api\V1\BaseApiRequest;
class AdminUserBulkUpdateStatusRequest extends BaseApiRequest { public function rules(): array { return ['user_ids'=>['nullable','array'],'ids'=>['nullable','array'],'status'=>['required','in:active,inactive,suspended,locked'],'reason'=>['nullable','string']]; } }
