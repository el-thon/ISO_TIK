<?php
namespace App\Http\Controllers\Api\V1\Admin;
use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Api\V1\Admin\System\{ClauseIndexRequest,ClauseStoreRequest,ClauseUpdateRequest};
use App\Services\Api\V1\Admin\System\AdminClauseService;
class AdminClauseController extends BaseApiController { public function __construct(private readonly AdminClauseService $clauses) {} public function index(ClauseIndexRequest $r){return $this->clauses->index($r);} public function store(ClauseStoreRequest $r){return $this->clauses->store($r->validated(),$r);} public function update(ClauseUpdateRequest $r,string $clauseId){return $this->clauses->update($clauseId,$r->validated(),$r);} public function destroy(string $clauseId){return $this->clauses->destroy($clauseId);} }
