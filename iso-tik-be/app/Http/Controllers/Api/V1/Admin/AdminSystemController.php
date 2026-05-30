<?php
namespace App\Http\Controllers\Api\V1\Admin;
use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Api\V1\Admin\System\UpdateSystemSettingsRequest;
use App\Services\Api\V1\Admin\System\AdminSystemSettingService;
class AdminSystemController extends BaseApiController { public function __construct(private readonly AdminSystemSettingService $settings) {} public function settings(){return $this->settings->index();} public function updateSettings(UpdateSystemSettingsRequest $r){return $this->settings->update($r->all(),$r);} }
