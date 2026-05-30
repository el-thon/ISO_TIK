<?php
namespace App\Http\Requests\Api\V1\Collaboration\Period;
use App\Http\Requests\Api\V1\BaseApiRequest;
class PeriodUpdateRequest extends BaseApiRequest { public function rules(): array { return ['name'=>['nullable','string'],'period_type'=>['nullable','string'],'start_date'=>['nullable','date'],'end_date'=>['nullable','date'],'join_code'=>['nullable','string'],'is_join_code_active'=>['nullable','boolean']]; } }
