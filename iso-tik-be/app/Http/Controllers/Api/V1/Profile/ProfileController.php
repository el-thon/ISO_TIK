<?php

namespace App\Http\Controllers\Api\V1\Profile;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Api\V1\Profile\ChangePasswordRequest;
use App\Http\Requests\Api\V1\Profile\UpdateEmploymentRequest;
use App\Http\Requests\Api\V1\Profile\UpdateProfileRequest;
use App\Http\Requests\Api\V1\Profile\UploadProfilePhotoRequest;
use App\Services\Api\V1\Profile\ProfileService;
use Illuminate\Http\JsonResponse;

class ProfileController extends BaseApiController
{
    public function __construct(private readonly ProfileService $profiles) {}

    public function show(): JsonResponse
    {
        return $this->profiles->show(request()->user());
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        return $this->profiles->update($request->user(), $request->validated());
    }

    public function updateEmployment(UpdateEmploymentRequest $request): JsonResponse
    {
        return $this->profiles->updateEmployment($request->user(), $request->validated());
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        return $this->profiles->changePassword($request->user(), $request->validated());
    }

    public function uploadPhoto(UploadProfilePhotoRequest $request): JsonResponse
    {
        return $this->profiles->uploadPhoto($request->user(), $request);
    }

    public function deletePhoto(): JsonResponse
    {
        return $this->profiles->deletePhoto(request()->user());
    }
}
