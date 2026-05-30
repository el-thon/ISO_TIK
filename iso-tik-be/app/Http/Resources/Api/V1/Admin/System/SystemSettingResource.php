<?php

namespace App\Http\Resources\Api\V1\Admin\System;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SystemSettingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'key' => $this->key,
            'value' => $this->value,
            'description' => $this->description,
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
