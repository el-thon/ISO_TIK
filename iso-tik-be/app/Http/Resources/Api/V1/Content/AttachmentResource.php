<?php

namespace App\Http\Resources\Api\V1\Content;

use App\Http\Resources\Api\V1\UserResource;
use App\Services\Api\V1\Content\FileStorageService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttachmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $filename = $this->filename ?: basename((string) $this->storage_url);
        $storage = app(FileStorageService::class);

        return [
            'id' => $this->id,
            'forum_id' => $this->forum_id,
            'topic_id' => $this->whenLoaded('inputItem', fn () => $this->inputItem?->topic_id, null),
            'input_item_id' => $this->input_item_id,
            'uploaded_by_user_id' => $this->created_by_user_id,
            'original_filename' => $filename,
            'file_name' => $filename,
            'filename' => $filename,
            'stored_path' => $this->storage_url,
            'path' => $this->storage_url,
            'url' => $storage->publicUrl($this->storage_url),
            'download_url' => url('/api/v1/attachments/'.$this->id.'/download'),
            'download_info_url' => url('/api/v1/attachments/'.$this->id.'/download-info'),
            'mime_type' => $this->content_type,
            'content_type' => $this->content_type,
            'size_bytes' => $this->size_bytes,
            'size' => $this->size_bytes,
            'file_size' => $this->size_bytes,
            'description' => null,
            'notes' => null,
            'metadata' => [],
            'exists' => $storage->exists($this->storage_url),
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
            'uploaded_by' => $this->whenLoaded('creator', fn () => new UserResource($this->creator)),
            'created_by' => $this->whenLoaded('creator', fn () => new UserResource($this->creator)),
            'topic' => null,
            'input_item' => $this->whenLoaded('inputItem', fn () => new InputItemResource($this->inputItem)),
        ];
    }
}
