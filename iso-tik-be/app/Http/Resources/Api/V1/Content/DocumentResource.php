<?php

namespace App\Http\Resources\Api\V1\Content;

use App\Http\Resources\Api\V1\UserResource;
use App\Services\Api\V1\Content\FileStorageService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $filename = $this->original_filename ?: basename((string) $this->stored_path);
        $storage = app(FileStorageService::class);

        return [
            'id' => $this->id,
            'topic_id' => null,
            'forum_id' => null,
            'topic_document_master_id' => null,
            'document_number' => null,
            'revision_number' => null,
            'title' => $this->title,
            'name' => $this->title,
            'description' => $this->description,
            'original_filename' => $filename,
            'display_name' => $this->title ?: $filename,
            'file_name' => $filename,
            'filename' => $filename,
            'stored_path' => $this->stored_path,
            'path' => $this->stored_path,
            'url' => $storage->publicUrl($this->stored_path),
            'download_url' => url('/api/v1/documents/'.$this->id.'/download'),
            'download_info_url' => url('/api/v1/documents/'.$this->id.'/download-info'),
            'mime_type' => $this->mime_type,
            'size_bytes' => $this->size_bytes,
            'size' => $this->size_bytes,
            'file_size' => $this->size_bytes,
            'status' => 'active',
            'is_active' => true,
            'metadata' => [],
            'exists' => $storage->exists($this->stored_path),
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
            'created_by' => $this->whenLoaded('uploader', fn () => new UserResource($this->uploader)),
            'uploaded_by' => $this->whenLoaded('uploader', fn () => new UserResource($this->uploader)),
            'topic' => null,
            'forum' => null,
            'master' => null,
        ];
    }
}
