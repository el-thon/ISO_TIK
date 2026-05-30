<?php
namespace App\Http\Requests\Api\V1\Collaboration\Forum;
use App\Http\Requests\Api\V1\BaseApiRequest;
class ForumParticipantUpdateRequest extends BaseApiRequest { public function rules(): array { return ['role'=>['nullable','string'],'is_responsible_user'=>['nullable','boolean']]; } }
