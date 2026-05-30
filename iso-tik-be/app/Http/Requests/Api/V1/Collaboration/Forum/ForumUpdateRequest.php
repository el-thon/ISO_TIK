<?php
namespace App\Http\Requests\Api\V1\Collaboration\Forum;
use App\Http\Requests\Api\V1\BaseApiRequest;
class ForumUpdateRequest extends BaseApiRequest { public function rules(): array { return ['name'=>['nullable','string'],'description'=>['nullable','string'],'visibility'=>['nullable','string'],'responsible_user_id'=>['nullable','string'],'join_code'=>['nullable','string'],'is_join_code_active'=>['nullable','boolean'],'is_locked'=>['nullable','boolean'],'is_archived'=>['nullable','boolean']]; } }
