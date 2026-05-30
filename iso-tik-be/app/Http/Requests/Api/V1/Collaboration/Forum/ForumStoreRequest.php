<?php
namespace App\Http\Requests\Api\V1\Collaboration\Forum;
use App\Http\Requests\Api\V1\BaseApiRequest;
class ForumStoreRequest extends BaseApiRequest { public function rules(): array { return ['name'=>['required','string'],'description'=>['nullable','string'],'visibility'=>['nullable','string'],'responsible_user_id'=>['nullable','string'],'join_code'=>['nullable','string'],'is_join_code_active'=>['nullable','boolean'],'participants'=>['nullable','array'],'participant_ids'=>['nullable','array'],'auditor_ids'=>['nullable','array'],'auditee_ids'=>['nullable','array']]; } }
