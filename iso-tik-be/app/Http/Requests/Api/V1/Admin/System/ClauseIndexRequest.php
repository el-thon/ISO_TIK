<?php
namespace App\Http\Requests\Api\V1\Admin\System;
use App\Http\Requests\Api\V1\BaseApiRequest;
class ClauseIndexRequest extends BaseApiRequest { public function rules(): array { return ['page'=>['nullable','integer'],'per_page'=>['nullable','integer'],'search'=>['nullable','string'],'q'=>['nullable','string'],'keyword'=>['nullable','string'],'is_active'=>['nullable'],'status'=>['nullable','string']]; } }
