<?php
namespace App\Http\Requests\Api\V1\Collaboration\Period;
use App\Http\Requests\Api\V1\BaseApiRequest;
class PeriodIndexRequest extends BaseApiRequest { public function rules(): array { return ['page'=>['nullable','integer'],'per_page'=>['nullable','integer'],'search'=>['nullable','string'],'q'=>['nullable','string'],'keyword'=>['nullable','string'],'status'=>['nullable','string'],'period_type'=>['nullable','string'],'is_active'=>['nullable'],'include_archived'=>['nullable']]; } }
