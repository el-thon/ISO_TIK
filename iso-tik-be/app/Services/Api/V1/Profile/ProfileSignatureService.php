<?php

namespace App\Services\Api\V1\Profile;

use App\Http\Resources\Api\V1\Profile\SignatureResource;
use App\Models\Content\UserSignature;
use App\Models\User;
use App\Services\Api\V1\Security\AuditLogService;
use App\Support\Api\ApiResponse;
use App\Support\Api\FileResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProfileSignatureService
{
    public function __construct(private readonly AuditLogService $audit) {}

    public function show(User $user): JsonResponse
    {
        $signature = $this->activeSignature($user->id);

        if (! $signature) {
            return ApiResponse::success(
                ['signature' => null],
                'Signature not found',
                200,
                ['signature' => null]
            );
        }

        return $this->signatureResponse($signature, 'Signature retrieved successfully');
    }

    public function store(User $user, Request $request): JsonResponse
    {
        $file = $request->file('file') ?: $request->file('signature') ?: $request->file('image');
        $path = $file->store("profiles/signatures/{$user->id}", 'public');
        $existing = $this->activeSignature($user->id);

        if ($existing && $existing->stored_path && ! str_starts_with($existing->stored_path, 'seed://') && Storage::disk('public')->exists($existing->stored_path)) {
            Storage::disk('public')->delete($existing->stored_path);
        }

        $signature = UserSignature::updateOrCreate(
            ['user_id' => $user->id],
            [
                'original_filename' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType() ?: $file->getMimeType(),
                'size_bytes' => $file->getSize(),
                'stored_path' => $path,
                'notes' => $request->input('notes'),
                'created_by_user_id' => $existing?->created_by_user_id ?: $user->id,
                'updated_by_user_id' => $user->id,
                'deleted_by_user_id' => null,
                'deletion_reason' => null,
                'deleted_at' => null,
            ]
        );

        return $this->signatureResponse($signature, 'Signature uploaded successfully');
    }

    public function destroy(User $user): JsonResponse
    {
        $signature = $this->activeSignature($user->id);

        if ($signature) {
            if ($signature->stored_path && ! str_starts_with($signature->stored_path, 'seed://') && Storage::disk('public')->exists($signature->stored_path)) {
                Storage::disk('public')->delete($signature->stored_path);
            }

            $signature->forceFill([
                'deleted_by_user_id' => $user->id,
                'deletion_reason' => 'Deleted by user',
            ])->save();
            $signature->delete();
        }

        return ApiResponse::success([], 'Signature deleted successfully');
    }

    public function download(User $user, ?Request $request = null): BinaryFileResponse|StreamedResponse|JsonResponse
    {
        $signature = $this->activeSignature($user->id);

        if (! $signature) {
            return ApiResponse::notFound('Signature not found');
        }

        $this->recordDownloadAudit($request?->user() ?: $user, $signature, 'signature_downloaded', 'signature', $request);

        return FileResponse::download($signature, $signature->original_filename, $signature->mime_type);
    }

    public function downloadForUser(string $userId, ?Request $request = null): BinaryFileResponse|StreamedResponse|JsonResponse
    {
        $signature = $this->activeSignature($userId);

        if (! $signature) {
            return ApiResponse::notFound('Signature not found');
        }

        $this->recordDownloadAudit($request?->user(), $signature, 'user_signature_downloaded', 'user_signature', $request);

        return FileResponse::download($signature, $signature->original_filename, $signature->mime_type);
    }

    private function activeSignature(string $userId): ?UserSignature
    {
        return UserSignature::query()
            ->where('user_id', $userId)
            ->latest()
            ->first();
    }

    private function signatureResponse(UserSignature $signature, string $message): JsonResponse
    {
        $payload = (new SignatureResource($signature))->resolve();

        return ApiResponse::success(
            ['signature' => $payload],
            $message,
            200,
            [
                'signature' => $payload,
                ...$payload,
            ]
        );
    }

    private function recordDownloadAudit(?User $actor, UserSignature $signature, string $action, string $entityType, ?Request $request): void
    {
        if (! $signature->stored_path || str_starts_with($signature->stored_path, 'seed://') || ! Storage::disk('public')->exists($signature->stored_path)) {
            return;
        }

        $this->audit->record($actor, $entityType, $signature->id, $action, [
            'file_name' => $signature->original_filename,
            'mime_type' => $signature->mime_type,
            'size_bytes' => $signature->size_bytes,
            'stored_path_hash' => hash('sha256', $signature->stored_path),
            'download_result' => 'success',
        ], $request);
    }
}
