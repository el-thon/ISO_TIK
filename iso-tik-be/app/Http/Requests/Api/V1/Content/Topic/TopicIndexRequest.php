<?php
namespace App\Http\Requests\Api\V1\Content\Topic;
use App\Http\Requests\Api\V1\BaseApiRequest;
class TopicIndexRequest extends BaseApiRequest { public function rules(): array { return ['page'=>['nullable','integer'],'per_page'=>['nullable','integer'],'search'=>['nullable','string'],'q'=>['nullable','string'],'keyword'=>['nullable','string'],'status'=>['nullable','string'],'workflow_status'=>['nullable','string'],'finding_type'=>['nullable','string'],'forum_id'=>['nullable','string'],'period_id'=>['nullable','string'],'assigned'=>['nullable'],'assigned_to_me'=>['nullable'],'created_by_me'=>['nullable'],'created_by'=>['nullable','string'],'mine'=>['nullable'],'include_archived'=>['nullable']]; } }
