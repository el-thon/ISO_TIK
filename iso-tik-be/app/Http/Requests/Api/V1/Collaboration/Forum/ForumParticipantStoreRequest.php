<?php
namespace App\Http\Requests\Api\V1\Collaboration\Forum;
use App\Http\Requests\Api\V1\BaseApiRequest;
class ForumParticipantStoreRequest extends BaseApiRequest { public function rules(): array { return ['user_id'=>['nullable','string'],'user_ids'=>['nullable','array'],'role'=>['nullable','string'],'participants'=>['nullable','array'],'is_responsible_user'=>['nullable','boolean']]; } }
