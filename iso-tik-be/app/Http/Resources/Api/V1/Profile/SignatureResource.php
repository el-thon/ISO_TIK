<?php

namespace App\Http\Resources\Api\V1\Profile;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class SignatureResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $downloadUrl = url('/api/v1/profile/signature/download');
        $storageUrl = $this->stored_path && ! str_starts_with($this->stored_path, 'seed://')
            ? Storage::disk('public')->url($this->stored_path)
            : null;

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'original_filename' => $this->original_filename,
            'filename' => $this->original_filename,
            'mime_type' => $this->mime_type,
            'size_bytes' => $this->size_bytes,
            'stored_path' => $this->stored_path,
            'storage_url' => $storageUrl,
            'signature_url' => $storageUrl ?: $downloadUrl,
            'url' => $storageUrl ?: $downloadUrl,
            'download_url' => $downloadUrl,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
