<?php

namespace App\Services\Api\V1\Content;

use App\Http\Resources\Api\V1\Content\AttachmentResource;
use App\Models\Collaboration\Forum;
use App\Models\Content\Attachment;
use App\Models\Content\InputItem;
use App\Services\Api\V1\Security\AuditLogService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttachmentService
{
    public function __construct(private readonly FileStorageService $files, private readonly AuditLogService $audit) {}

    public function index(string $forumId, Request $request): JsonResponse
    {
        Forum::findOrFail($forumId);
        $search = $request->input('search') ?: $request->input('q') ?: $request->input('keyword');

        $query = Attachment::query()
            ->forForum($forumId)
            ->with(['creator', 'inputItem'])
            ->when($request->input('input_item_id'), fn ($q, $id) => $q->where('input_item_id', $id))
            ->when($request->input('topic_id'), fn ($q, $id) => $q->whereHas('inputItem', fn ($i) => $i->where('topic_id', $id)))
            ->when($request->input('uploaded_by'), fn ($q, $id) => $q->where('created_by_user_id', $id))
            ->when($request->input('mime_type') ?: $request->input('type'), fn ($q, $mime) => $q->where('content_type', 'ilike', '%'.$mime.'%'))
            ->when($search, fn ($q) => $q->where('filename', 'ilike', '%'.$search.'%'));

        $paginator = $query->latest()->paginate((int) $request->integer('per_page', 10));
        $items = collect($paginator->items())->map(fn ($attachment) => (new AttachmentResource($attachment))->resolve($request))->values()->all();
        $pagination = $this->pagination($paginator);

        return response()->json([
            'success' => true,
            'message' => 'Attachments retrieved successfully',
            'data' => ['attachments' => $items, 'files' => $items, 'items' => $items, 'evidence' => $items, 'documents' => $items],
            'attachments' => $items,
            'files' => $items,
            'items' => $items,
            'evidence' => $items,
            'documents' => $items,
            'meta' => $pagination,
            'pagination' => $pagination,
        ]);
    }

    public function store(string $forumId, array $payload, Request $request): JsonResponse
    {
        Forum::findOrFail($forumId);
        $file = $this->files->fileFrom($request);

        if (! $file) {
            return ApiResponse::validationError(['file' => ['The file field is required.']]);
        }

        $inputItemId = $payload['input_item_id'] ?? null;
        if ($inputItemId) {
            $inputItem = InputItem::with('topic')->findOrFail($inputItemId);
            abort_unless($inputItem->topic?->forum_id === $forumId, 422, 'Input item does not belong to this forum.');
        }

        $stored = $this->files->store($file, 'forums/'.$forumId.'/attachments/'.now()->format('Y/m/d'));
        $attachment = Attachment::create([
            'forum_id' => $forumId,
            'input_item_id' => $inputItemId,
            'storage_url' => $stored['path'],
            'filename' => $stored['original_filename'],
            'content_type' => $stored['mime_type'],
            'size_bytes' => $stored['size_bytes'],
            'checksum' => $stored['checksum'],
            'created_by_user_id' => $request->user()?->id,
        ])->load(['creator', 'inputItem']);

        $this->audit->record($request->user(), 'attachment', $attachment->id, 'upload_forum_attachment', ['forum_id' => $forumId], $request);

        $resource = (new AttachmentResource($attachment))->resolve($request);

        return ApiResponse::success(
            ['attachment' => $resource, 'file' => $resource],
            'Attachment uploaded successfully',
            200,
            ['attachment' => $resource, 'file' => $resource]
        );
    }

    public function downloadInfo(string $attachmentId, Request $request): JsonResponse
    {
        $attachment = Attachment::with(['creator', 'inputItem'])->findOrFail($attachmentId);
        $resource = (new AttachmentResource($attachment))->resolve($request);

        $data = [
            'attachment' => $resource,
            'download_url' => $resource['download_url'],
            'filename' => $resource['filename'],
            'mime_type' => $resource['mime_type'],
            'size' => $resource['size'],
            'exists' => $resource['exists'],
        ];

        return ApiResponse::success($data, 'Attachment download info retrieved successfully', 200, $data);
    }

    public function download(string $attachmentId, Request $request): BinaryFileResponse|StreamedResponse|JsonResponse
    {
        $attachment = Attachment::findOrFail($attachmentId);
        if ($this->files->exists($attachment->storage_url)) {
            $this->audit->record($request->user(), 'attachment', $attachment->id, 'attachment_downloaded', [
                'file_name' => $attachment->filename,
                'mime_type' => $attachment->content_type,
                'size_bytes' => $attachment->size_bytes,
                'stored_path_hash' => $attachment->storage_url ? hash('sha256', $attachment->storage_url) : null,
                'download_result' => 'success',
            ], $request);
        }

        return $this->files->download($attachment->storage_url, $attachment->filename, $attachment->content_type);
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
