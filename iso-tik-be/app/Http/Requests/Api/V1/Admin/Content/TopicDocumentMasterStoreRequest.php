<?php
namespace App\Http\Requests\Api\V1\Admin\Content;
use App\Http\Requests\Api\V1\BaseApiRequest;
class TopicDocumentMasterStoreRequest extends BaseApiRequest { public function rules(): array { return ['document_number'=>['required','string'],'revision_number'=>['nullable','string'],'published_at'=>['nullable','date'],'is_active'=>['nullable','boolean']]; } }
