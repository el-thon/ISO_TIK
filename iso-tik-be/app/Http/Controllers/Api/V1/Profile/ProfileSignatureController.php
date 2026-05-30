<?php

namespace App\Http\Controllers\Api\V1\Profile;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Api\V1\Profile\UploadSignatureRequest;
use App\Services\Api\V1\Profile\ProfileSignatureService;

class ProfileSignatureController extends BaseApiController
{
    public function __construct(private readonly ProfileSignatureService $signatures) {}

    public function show()
    {
        return $this->signatures->show(request()->user());
    }

    public function store(UploadSignatureRequest $request)
    {
        return $this->signatures->store($request->user(), $request);
    }

    public function destroy()
    {
        return $this->signatures->destroy(request()->user());
    }

    public function download()
    {
        return $this->signatures->download(request()->user(), request());
    }

    public function downloadUserSignature(string $userId)
    {
        return $this->signatures->downloadForUser($userId, request());
    }
}
