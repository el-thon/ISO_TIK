<?php
namespace App\Http\Requests\Api\V1\Collaboration\Period;
use App\Http\Requests\Api\V1\BaseApiRequest;
class JoinRequestIndexRequest extends BaseApiRequest { public function rules(): array { return ['page'=>['nullable','integer'],'per_page'=>['nullable','integer'],'status'=>['nullable','string'],'search'=>['nullable','string']]; } }
