<?php

namespace App\Services\Api\V1\Content;

use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FileStorageService
{
    public function fileFrom(Request $request): ?UploadedFile
    {
        foreach (['file', 'attachment', 'document', 'evidence', 'upload'] as $field) {
            if ($request->hasFile($field)) {
                return $request->file($field);
            }
        }

        return null;
    }

    public function store(UploadedFile $file, string $directory): array
    {
        $safeName = Str::uuid()->toString().'-'.Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));
        $extension = $file->getClientOriginalExtension();
        $filename = trim($safeName.($extension ? '.'.$extension : ''), '.');
        $path = Storage::disk('public')->putFileAs($directory, $file, $filename);

        return [
            'path' => $path,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType() ?: $file->getMimeType(),
            'size_bytes' => $file->getSize(),
            'checksum' => hash_file('sha256', $file->getRealPath()),
        ];
    }

    public function exists(?string $path): bool
    {
        $path = $this->normalizePath($path);

        return $path !== null && Storage::disk('public')->exists($path);
    }

    public function publicUrl(?string $path): ?string
    {
        $path = $this->normalizePath($path);

        return $path ? Storage::disk('public')->url($path) : null;
    }

    public function download(?string $path, ?string $filename, ?string $mimeType): BinaryFileResponse|StreamedResponse|JsonResponse
    {
        $path = $this->normalizePath($path);

        if (! $path || ! Storage::disk('public')->exists($path)) {
            return ApiResponse::notFound('File not found');
        }

        return Storage::disk('public')->download($path, $filename ?: basename($path), array_filter([
            'Content-Type' => $mimeType,
        ]));
    }

    public function normalizePath(?string $path): ?string
    {
        if (! $path || str_starts_with($path, 'seed://')) {
            return null;
        }

        $path = preg_replace('#^https?://[^/]+/storage/#', '', $path) ?? $path;
        $path = preg_replace('#^/?storage/#', '', $path) ?? $path;

        return ltrim($path, '/');
    }
}
