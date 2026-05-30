<?php
namespace App\Http\Requests\Api\V1\Collaboration\Period;
use App\Http\Requests\Api\V1\BaseApiRequest;
class JoinPeriodRequest extends BaseApiRequest { public function rules(): array { return ['period_id'=>['nullable','string'],'join_code'=>['nullable','string'],'code'=>['nullable','string']]; } }
