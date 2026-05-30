<?php

namespace App\Services\Api\V1\Content;

use App\Http\Resources\Api\V1\Content\DocumentResource;
use App\Models\Collaboration\Forum;
use App\Models\Content\Document;
use App\Models\Content\Topic;
use App\Models\Content\TopicDocumentMaster;
use App\Services\Api\V1\Security\AuditLogService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentService
{
    public function __construct(private readonly FileStorageService $files, private readonly AuditLogService $audit) {}

    public function index(Request $request): JsonResponse
    {
        $search = $request->input('search') ?: $request->input('q') ?: $request->input('keyword');

        $query = Document::query()
            ->with('uploader')
            ->when($search, fn ($q) => $q->where(fn ($i) => $i
                ->where('title', 'ilike', '%'.$search.'%')
                ->orWhere('description', 'ilike', '%'.$search.'%')
                ->orWhere('original_filename', 'ilike', '%'.$search.'%')));

        $paginator = $query->latest()->paginate((int) $request->integer('per_page', 10));
        $items = collect($paginator->items())->map(fn ($document) => (new DocumentResource($document))->resolve($request))->values()->all();
        $pagination = $this->pagination($paginator);

        return response()->json([
            'success' => true,
            'message' => 'Documents retrieved successfully',
            'data' => ['documents' => $items, 'items' => $items],
            'documents' => $items,
            'items' => $items,
            'meta' => $pagination,
            'pagination' => $pagination,
        ]);
    }

    public function store(array $payload, Request $request): JsonResponse
    {
        if (! $request->user()?->hasRole('admin')) {
            return ApiResponse::forbidden('Only admin can manage documents');
        }

        $file = $this->files->fileFrom($request);
        if (! $file) {
            return ApiResponse::validationError(['file' => ['The file field is required.']]);
        }

        $this->validateRelations($payload);
        $stored = $this->files->store($file, 'documents/'.now()->format('Y/m/d'));

        $document = Document::create([
            'title' => $payload['title'] ?? $payload['name'] ?? pathinfo($stored['original_filename'], PATHINFO_FILENAME),
            'description' => $payload['description'] ?? null,
            'original_filename' => $stored['original_filename'],
            'mime_type' => $stored['mime_type'],
            'size_bytes' => $stored['size_bytes'],
            'stored_path' => $stored['path'],
            'uploaded_by_user_id' => $request->user()?->id,
        ])->load('uploader');

        $this->audit->record($request->user(), 'document', $document->id, 'document_uploaded', $this->fileAuditDetails($document), $request);

        return $this->documentResponse($document, 'Document created successfully', $request);
    }

    public function show(string $documentId, Request $request): JsonResponse
    {
        return $this->documentResponse(Document::with('uploader')->findOrFail($documentId), 'Document retrieved successfully', $request);
    }

    public function update(string $documentId, array $payload, Request $request): JsonResponse
    {
        if (! $request->user()?->hasRole('admin')) {
            return ApiResponse::forbidden('Only admin can manage documents');
        }

        $document = Document::findOrFail($documentId);
        $this->validateRelations($payload);

        $updates = [];
        if (array_key_exists('title', $payload) || array_key_exists('name', $payload)) {
            $updates['title'] = $payload['title'] ?? $payload['name'];
        }
        if (array_key_exists('description', $payload)) {
            $updates['description'] = $payload['description'];
        }

        $file = $this->files->fileFrom($request);
        if ($file) {
            $oldPath = $document->stored_path;
            $stored = $this->files->store($file, 'documents/'.now()->format('Y/m/d'));
            $updates = array_merge($updates, [
                'original_filename' => $stored['original_filename'],
                'mime_type' => $stored['mime_type'],
                'size_bytes' => $stored['size_bytes'],
                'stored_path' => $stored['path'],
            ]);

            $normalizedOldPath = $this->files->normalizePath($oldPath);
            if ($normalizedOldPath && Storage::disk('public')->exists($normalizedOldPath)) {
                Storage::disk('public')->delete($normalizedOldPath);
            }
        }

        if ($updates !== []) {
            $document->fill($updates)->save();
        }

        $this->audit->record($request->user(), 'document', $document->id, 'document_updated', $this->fileAuditDetails($document->fresh()), $request);

        return $this->documentResponse($document->fresh('uploader'), 'Document updated successfully', $request);
    }

    public function destroy(string $documentId, Request $request): JsonResponse
    {
        if (! $request->user()?->hasRole('admin')) {
            return ApiResponse::forbidden('Only admin can manage documents');
        }

        $document = Document::findOrFail($documentId);
        $details = $this->fileAuditDetails($document);
        $document->delete();
        $this->audit->record($request->user(), 'document', $document->id, 'document_deleted', $details, $request);

        return ApiResponse::success([], 'Document deleted successfully');
    }

    public function downloadInfo(string $documentId, Request $request): JsonResponse
    {
        $document = Document::with('uploader')->findOrFail($documentId);
        $resource = (new DocumentResource($document))->resolve($request);

        $data = [
            'document' => $resource,
            'download_url' => $resource['download_url'],
            'filename' => $resource['filename'],
            'mime_type' => $resource['mime_type'],
            'size' => $resource['size'],
            'exists' => $resource['exists'],
        ];

        return ApiResponse::success($data, 'Document download info retrieved successfully', 200, $data);
    }

    public function download(string $documentId, Request $request): BinaryFileResponse|StreamedResponse|JsonResponse
    {
        $document = Document::findOrFail($documentId);
        if ($this->files->exists($document->stored_path)) {
            $this->audit->record($request->user(), 'document', $document->id, 'document_downloaded', $this->fileAuditDetails($document) + ['download_result' => 'success'], $request);
        }

        return $this->files->download($document->stored_path, $document->original_filename, $document->mime_type);
    }

    private function documentResponse(Document $document, string $message, Request $request): JsonResponse
    {
        $document->loadMissing('uploader');
        $resource = (new DocumentResource($document))->resolve($request);

        return ApiResponse::success(['document' => $resource], $message, 200, ['document' => $resource]);
    }

    private function validateRelations(array $payload): void
    {
        if ($payload['topic_id'] ?? null) {
            Topic::findOrFail($payload['topic_id']);
        }
        if ($payload['forum_id'] ?? null) {
            Forum::findOrFail($payload['forum_id']);
        }
        if ($payload['topic_document_master_id'] ?? null) {
            TopicDocumentMaster::findOrFail($payload['topic_document_master_id']);
        }
    }

    private function fileAuditDetails(Document $document): array
    {
        return [
            'file_name' => $document->original_filename,
            'mime_type' => $document->mime_type,
            'size_bytes' => $document->size_bytes,
            'stored_path_hash' => $document->stored_path ? hash('sha256', $document->stored_path) : null,
        ];
    }

    private function pagination($paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'last_page' => $paginator->lastPage(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
        ];
    }
}
