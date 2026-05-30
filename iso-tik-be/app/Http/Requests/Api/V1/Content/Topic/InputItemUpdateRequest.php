<?php
namespace App\Http\Requests\Api\V1\Content\Topic;
use App\Http\Requests\Api\V1\BaseApiRequest;
class InputItemUpdateRequest extends BaseApiRequest { public function rules(): array { return ['type'=>['nullable','string'],'label'=>['nullable','string'],'value'=>['nullable'],'content'=>['nullable'],'description'=>['nullable','string'],'clause_id'=>['nullable','string'],'clause_code'=>['nullable','string'],'clause_name'=>['nullable','string'],'recommendation'=>['nullable','string'],'metadata'=>['nullable','array'],'sort_order'=>['nullable','integer'],'order_index'=>['nullable','integer'],'status'=>['nullable','string'],'visibility'=>['nullable','string']]; } }
