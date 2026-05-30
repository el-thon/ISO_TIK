<?php
namespace App\Http\Requests\Api\V1\Admin\Content;
class TopicDocumentMasterUpdateRequest extends TopicDocumentMasterStoreRequest { public function rules(): array { return ['id'=>['nullable','string'],'document_number'=>['nullable','string'],'revision_number'=>['nullable','string'],'published_at'=>['nullable','date'],'is_active'=>['nullable','boolean']]; } }
