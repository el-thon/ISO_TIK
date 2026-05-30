<?php

namespace App\Services\Api\V1\Profile;

use App\Http\Resources\Api\V1\Profile\ProfileResource;
use App\Models\Auth\UserAddress;
use App\Models\Auth\UserContact;
use App\Models\Auth\UserEmployment;
use App\Models\Auth\UserProfile;
use App\Models\User;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ProfileService
{
    public function show(User $user): JsonResponse
    {
        return $this->profileResponse($user, 'Profile retrieved successfully');
    }

    public function update(User $user, array $payload): JsonResponse
    {
        $userData = $this->onlyFromFlatAndNested($payload, 'user', [
            'name', 'username', 'email', 'photo_url',
        ]);

        if ($userData !== []) {
            $user->fill($userData)->save();
        }

        $profileData = $this->onlyFromFlatAndNested($payload, 'profile', [
            'full_name', 'title_prefix', 'title_suffix', 'gender', 'birth_place', 'birth_date', 'marital_status',
        ]);
        if (! isset($profileData['full_name']) && ($payload['name'] ?? null)) {
            $profileData['full_name'] = $payload['name'];
        }
        if ($profileData !== []) {
            UserProfile::updateOrCreate(['user_id' => $user->id], array_merge($profileData, ['deleted_at' => null]));
        }

        $contactData = $this->onlyFromFlatAndNested($payload, 'contact', [
            'phone_number', 'email_institutional', 'email_personal',
        ]);
        if (($payload['phone'] ?? null) && ! isset($contactData['phone_number'])) {
            $contactData['phone_number'] = $payload['phone'];
        }
        if ($contactData !== []) {
            UserContact::updateOrCreate(['user_id' => $user->id], array_merge($contactData, ['deleted_at' => null]));
        }

        $addressData = $this->onlyFromFlatAndNested($payload, 'address', [
            'address_line1', 'address_line2', 'city', 'province', 'postal_code', 'country',
        ]);
        if (($payload['address'] ?? null) && is_string($payload['address']) && ! isset($addressData['address_line1'])) {
            $addressData['address_line1'] = $payload['address'];
        }
        if ($addressData !== []) {
            UserAddress::updateOrCreate(['user_id' => $user->id], array_merge($addressData, ['deleted_at' => null]));
        }

        return $this->profileResponse($user, 'Profile updated successfully');
    }

    public function updateEmployment(User $user, array $payload): JsonResponse
    {
        $employmentData = Arr::only($payload, [
            'employee_id',
            'lecturer_id',
            'student_id',
            'faculty',
            'department',
            'study_program',
            'unit',
            'office_location',
            'functional_position',
            'structural_position',
            'rank_grade',
            'employment_status',
            'employment_start_date',
            'employment_end_date',
            'highest_education',
        ]);

        UserEmployment::updateOrCreate(
            ['user_id' => $user->id],
            array_merge($employmentData, ['deleted_at' => null])
        );

        $user->refresh();
        $payload = (new ProfileResource($user))->resolve();

        return ApiResponse::success(
            [
                'employment' => $payload['employment'],
                'user' => $payload['user'],
                'profile' => $payload['profile'],
            ],
            'Employment updated successfully',
            200,
            [
                'employment' => $payload['employment'],
                'user' => $payload['user'],
                'profile' => $payload['profile'],
            ]
        );
    }

    public function changePassword(User $user, array $payload): JsonResponse
    {
        $currentPassword = $payload['current_password'] ?? $payload['old_password'] ?? null;
        $newPassword = $payload['new_password'] ?? $payload['password'] ?? null;
        $confirmation = $payload['new_password_confirmation'] ?? $payload['password_confirmation'] ?? null;

        if (! Hash::check((string) $currentPassword, $user->password_hash)) {
            return ApiResponse::error('Current password is invalid', 422, [
                'current_password' => ['Current password is invalid.'],
            ]);
        }

        if ($confirmation !== null && $newPassword !== $confirmation) {
            throw ValidationException::withMessages([
                'new_password' => ['Password confirmation does not match.'],
            ]);
        }

        $user->forceFill([
            'password_hash' => Hash::make((string) $newPassword),
            'password_changed_at' => now(),
        ])->save();

        return ApiResponse::success([], 'Password changed successfully');
    }

    public function uploadPhoto(User $user, Request $request): JsonResponse
    {
        $file = $request->file('photo') ?: $request->file('image') ?: $request->file('file');
        $path = $file->store("profiles/photos/{$user->id}", 'public');

        if ($user->photo_url && ! str_starts_with($user->photo_url, 'http') && Storage::disk('public')->exists($user->photo_url)) {
            Storage::disk('public')->delete($user->photo_url);
        }

        $user->forceFill(['photo_url' => $path])->save();
        $payload = (new ProfileResource($user->fresh()))->resolve();

        return ApiResponse::success(
            [
                'photo_url' => $path,
                'user' => $payload['user'],
                'profile' => $payload['profile'],
            ],
            'Profile photo uploaded successfully',
            200,
            [
                'photo_url' => $path,
                'user' => $payload['user'],
            ]
        );
    }

    public function deletePhoto(User $user): JsonResponse
    {
        if ($user->photo_url && ! str_starts_with($user->photo_url, 'http') && Storage::disk('public')->exists($user->photo_url)) {
            Storage::disk('public')->delete($user->photo_url);
        }

        $user->forceFill(['photo_url' => null])->save();
        $payload = (new ProfileResource($user->fresh()))->resolve();

        return ApiResponse::success(
            [
                'photo_url' => null,
                'user' => $payload['user'],
            ],
            'Profile photo deleted successfully',
            200,
            [
                'photo_url' => null,
                'user' => $payload['user'],
            ]
        );
    }

    private function profileResponse(User $user, string $message): JsonResponse
    {
        $user->refresh();
        $payload = (new ProfileResource($user))->resolve();

        return ApiResponse::success($payload, $message, 200, [
            'user' => $payload['user'],
            'profile' => $payload['profile'],
            'contact' => $payload['contact'],
            'address' => $payload['address'],
            'employment' => $payload['employment'],
            'roles' => $payload['roles'],
        ]);
    }

    private function onlyFromFlatAndNested(array $payload, string $nestedKey, array $keys): array
    {
        $flat = Arr::only($payload, $keys);
        $nested = is_array($payload[$nestedKey] ?? null) ? Arr::only($payload[$nestedKey], $keys) : [];

        return array_filter(array_merge($flat, $nested), fn ($value) => $value !== null);
    }
}
