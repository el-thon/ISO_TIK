<?php

namespace App\Http\Resources\Api\V1\Content;

use App\Http\Resources\Api\V1\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InputItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'topic_id' => $this->topic_id,
            'type' => $this->type,
            'label' => $this->label,
            'value' => $this->value,
            'content' => $this->value,
            'description' => $this->metadata['description'] ?? $this->value,
            'metadata' => $this->metadata ?: [],
            'order_index' => $this->order_index,
            'sort_order' => $this->order_index,
            'visibility' => $this->visibility,
            'created_by_user_id' => $this->created_by_user_id,
            'created_by' => $this->whenLoaded('creator', fn () => new UserResource($this->creator)),
            'attachments' => $this->whenLoaded('attachments', fn () => $this->attachments),
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
            'deleted_at' => optional($this->deleted_at)->toISOString(),
        ];
    }
}
