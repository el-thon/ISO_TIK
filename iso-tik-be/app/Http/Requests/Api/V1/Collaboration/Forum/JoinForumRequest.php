<?php
namespace App\Http\Requests\Api\V1\Collaboration\Forum;
use App\Http\Requests\Api\V1\BaseApiRequest;
class JoinForumRequest extends BaseApiRequest { public function rules(): array { return ['join_code'=>['nullable','string'],'code'=>['nullable','string']]; } }
