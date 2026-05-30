<?php
namespace App\Http\Controllers\Api\V1\Admin;
use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Api\V1\Admin\Content\{TopicDocumentMasterIndexRequest,TopicDocumentMasterStoreRequest,TopicDocumentMasterUpdateRequest};
use App\Services\Api\V1\Admin\Content\TopicDocumentMasterService;
class AdminTopicDocumentMasterController extends BaseApiController { public function __construct(private readonly TopicDocumentMasterService $masters) {} public function index(TopicDocumentMasterIndexRequest $r){return $this->masters->index($r);} public function store(TopicDocumentMasterStoreRequest $r){return $this->masters->store($r->validated());} public function update(TopicDocumentMasterUpdateRequest $r,string $id){return $this->masters->update($id,$r->validated());} public function destroy(string $id){return $this->masters->destroy($id);} public function active(){return $this->masters->active();} }
