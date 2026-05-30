<?php
namespace App\Http\Requests\Api\V1\Content\Topic;
use App\Http\Requests\Api\V1\BaseApiRequest;
class TopicStoreRequest extends BaseApiRequest { public function rules(): array { return ['title'=>['nullable','string'],'name'=>['nullable','string'],'description'=>['nullable','string'],'finding_type'=>['nullable','string'],'status'=>['nullable','string'],'topic_document_master_id'=>['nullable','string'],'document_master_id'=>['nullable','string'],'document_number'=>['nullable','string'],'revision_number'=>['nullable','string'],'published_at'=>['nullable'],'input_items'=>['nullable','array'],'items'=>['nullable','array'],'findings'=>['nullable','array'],'clauses'=>['nullable','array'],'metadata'=>['nullable','array']]; } }
