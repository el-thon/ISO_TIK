<?php

namespace App\Support\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FileResponse
{
    public static function metadata(object|array $file): array
    {
        $data = is_array($file) ? $file : $file->toArray();

        return [
            'id' => $data['id'] ?? null,
            'filename' => $data['filename'] ?? $data['original_filename'] ?? $data['name'] ?? null,
            'original_filename' => $data['original_filename'] ?? $data['filename'] ?? $data['name'] ?? null,
            'mime_type' => $data['mime_type'] ?? $data['content_type'] ?? null,
            'size_bytes' => $data['size_bytes'] ?? $data['file_size'] ?? null,
            'stored_path' => $data['stored_path'] ?? $data['path'] ?? null,
            'storage_url' => $data['storage_url'] ?? $data['url'] ?? null,
            'download_url' => $data['download_url'] ?? null,
        ];
    }

    public static function downloadInfo(object|array $file, string $key = 'file'): JsonResponse
    {
        $metadata = self::metadata($file);

        return ApiResponse::success(
            [$key => $metadata],
            'Download info retrieved successfully',
            200,
            [$key => $metadata]
        );
    }

    public static function download(
        object|array|string|null $file,
        ?string $downloadName = null,
        ?string $mimeType = null,
        string $disk = 'public'
    ): BinaryFileResponse|StreamedResponse|JsonResponse {
        $metadata = is_string($file)
            ? ['stored_path' => $file, 'filename' => $downloadName]
            : self::metadata($file ?? []);

        $path = $metadata['stored_path'] ?? null;

        if (! $path || str_starts_with((string) $path, 'seed://') || ! Storage::disk($disk)->exists($path)) {
            return ApiResponse::notFound('File not found');
        }

        return Storage::disk($disk)->download(
            $path,
            $downloadName ?? $metadata['original_filename'] ?? $metadata['filename'] ?? basename($path),
            array_filter(['Content-Type' => $mimeType ?? $metadata['mime_type'] ?? null])
        );
    }
}
