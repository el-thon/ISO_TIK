<?php
namespace App\Http\Requests\Api\V1\Content\Topic;
use App\Http\Requests\Api\V1\BaseApiRequest;
class InputItemIndexRequest extends BaseApiRequest { public function rules(): array { return ['page'=>['nullable','integer'],'per_page'=>['nullable','integer'],'type'=>['nullable','string'],'search'=>['nullable','string'],'q'=>['nullable','string'],'keyword'=>['nullable','string']]; } }
