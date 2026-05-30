<?php

namespace App\Http\Controllers\Api\V1\Content;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Api\V1\Content\Document\DocumentDeleteRequest;
use App\Http\Requests\Api\V1\Content\Document\DocumentIndexRequest;
use App\Http\Requests\Api\V1\Content\Document\DocumentStoreRequest;
use App\Http\Requests\Api\V1\Content\Document\DocumentUpdateRequest;
use App\Services\Api\V1\Content\DocumentService;
use Illuminate\Http\Request;

class DocumentController extends BaseApiController
{
    public function __construct(private readonly DocumentService $documents) {}

    public function index(DocumentIndexRequest $request)
    {
        return $this->documents->index($request);
    }

    public function store(DocumentStoreRequest $request)
    {
        return $this->documents->store($request->validated(), $request);
    }

    public function show(string $documentId, Request $request)
    {
        return $this->documents->show($documentId, $request);
    }

    public function update(DocumentUpdateRequest $request, string $documentId)
    {
        return $this->documents->update($documentId, $request->validated(), $request);
    }

    public function destroy(DocumentDeleteRequest $request, string $documentId)
    {
        return $this->documents->destroy($documentId, $request);
    }

    public function downloadInfo(string $documentId, Request $request)
    {
        return $this->documents->downloadInfo($documentId, $request);
    }

    public function download(string $documentId, Request $request)
    {
        return $this->documents->download($documentId, $request);
    }
}
