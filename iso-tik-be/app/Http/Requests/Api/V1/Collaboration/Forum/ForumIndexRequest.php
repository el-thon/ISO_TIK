<?php
namespace App\Http\Requests\Api\V1\Collaboration\Forum;
use App\Http\Requests\Api\V1\BaseApiRequest;
class ForumIndexRequest extends BaseApiRequest { public function rules(): array { return ['page'=>['nullable','integer'],'per_page'=>['nullable','integer'],'search'=>['nullable','string'],'q'=>['nullable','string'],'keyword'=>['nullable','string'],'forum_period_id'=>['nullable','string'],'period_id'=>['nullable','string'],'status'=>['nullable','string'],'visibility'=>['nullable','string'],'is_archived'=>['nullable'],'mine'=>['nullable']]; } }
