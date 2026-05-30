<?php
namespace App\Http\Requests\Api\V1\Content\Topic;
use App\Http\Requests\Api\V1\BaseApiRequest;
class TopicVersionIndexRequest extends BaseApiRequest { public function rules(): array { return ['page'=>['nullable','integer'],'per_page'=>['nullable','integer']]; } }
