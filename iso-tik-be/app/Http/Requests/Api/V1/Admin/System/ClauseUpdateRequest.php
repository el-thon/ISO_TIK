<?php
namespace App\Http\Requests\Api\V1\Admin\System;
class ClauseUpdateRequest extends ClauseStoreRequest { public function rules(): array { return ['code'=>['nullable','string'],'name'=>['nullable','string'],'description'=>['nullable','string'],'is_active'=>['nullable','boolean']]; } }
