<?php
namespace App\Http\Requests\Api\V1\Admin\Content;
use App\Http\Requests\Api\V1\BaseApiRequest;
class TopicDocumentMasterIndexRequest extends BaseApiRequest { public function rules(): array { return ['page'=>['nullable','integer'],'per_page'=>['nullable','integer'],'search'=>['nullable','string'],'q'=>['nullable','string'],'keyword'=>['nullable','string'],'is_active'=>['nullable'],'status'=>['nullable','string']]; } }
