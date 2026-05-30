<?php
namespace App\Http\Requests\Api\V1\Admin\System;
use App\Http\Requests\Api\V1\BaseApiRequest;
class ClauseStoreRequest extends BaseApiRequest { public function rules(): array { return ['code'=>['required','string'],'name'=>['required','string'],'description'=>['nullable','string'],'is_active'=>['nullable','boolean']]; } }
