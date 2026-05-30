<?php
namespace App\Http\Requests\Api\V1\Content\Topic;
use App\Http\Requests\Api\V1\BaseApiRequest;
class TopicWorkflowActionRequest extends BaseApiRequest { public function rules(): array { return ['comment'=>['nullable','string'],'reason'=>['nullable','string']]; } }
