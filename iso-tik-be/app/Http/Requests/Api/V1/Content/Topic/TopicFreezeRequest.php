<?php
namespace App\Http\Requests\Api\V1\Content\Topic;
use App\Http\Requests\Api\V1\BaseApiRequest;
class TopicFreezeRequest extends BaseApiRequest { public function rules(): array { return ['reason'=>['nullable','string'],'freeze_reason'=>['nullable','string'],'until'=>['nullable','date'],'frozen_until'=>['nullable','date'],'comment'=>['nullable','string']]; } }
