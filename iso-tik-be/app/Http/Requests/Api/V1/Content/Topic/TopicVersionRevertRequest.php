<?php
namespace App\Http\Requests\Api\V1\Content\Topic;
use App\Http\Requests\Api\V1\BaseApiRequest;
class TopicVersionRevertRequest extends BaseApiRequest { public function rules(): array { return ['reason'=>['nullable','string']]; } }
