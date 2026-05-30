<?php

namespace App\Services\Api\V1\Admin\System;

use App\Http\Resources\Api\V1\Admin\System\SystemSettingResource;
use App\Models\System\Setting;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSystemSettingService
{
    private const ALLOWED = ['security.login_otp.enabled'];

    public function index(): JsonResponse { $settings=$this->settings(); $items=$this->items(); return ApiResponse::success(['settings'=>$items,'settings_map'=>$settings,'items'=>$items], 'Settings retrieved successfully', 200, ['settings'=>$settings,'settings_map'=>$settings,'items'=>$items]); }

    public function update(array $payload, Request $request): JsonResponse
    {
        $input = $this->normalizeInput($payload);

        foreach (self::ALLOWED as $key) {
            if (array_key_exists($key, $input)) {
                Setting::updateOrCreate(['key' => $key], [
                    'value' => $input[$key],
                    'description' => 'Managed by admin API',
                    'updated_by' => $request->user()?->id,
                    'updated_at' => now(),
                ]);
            }
        }

        return $this->index();
    }

    private function settings(): array { $rows=Setting::whereIn('key', self::ALLOWED)->get(); $out=[]; foreach(self::ALLOWED as $key){$out[$key]=$rows->firstWhere('key',$key)?->value ?? false;} return $out; }
    private function items(): array { return Setting::whereIn('key', self::ALLOWED)->get()->map(fn($s)=>(new SystemSettingResource($s))->resolve())->all(); }

    private function normalizeInput(array $payload): array
    {
        $settings = $payload['settings'] ?? null;

        if (! is_array($settings)) {
            return $payload;
        }

        if (array_is_list($settings)) {
            $normalized = [];

            foreach ($settings as $setting) {
                if (! is_array($setting) || ! array_key_exists('key', $setting)) {
                    continue;
                }

                $normalized[$setting['key']] = $setting['value'] ?? null;
            }

            return $normalized;
        }

        return $settings;
    }
}
