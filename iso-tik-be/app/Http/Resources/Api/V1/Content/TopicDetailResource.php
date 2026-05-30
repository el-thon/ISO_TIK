<?php

namespace App\Http\Resources\Api\V1\Content;

use App\Http\Resources\Api\V1\Collaboration\ForumParticipantResource;
use Illuminate\Http\Request;

class TopicDetailResource extends TopicResource
{
    public function toArray(Request $request): array
    {
        $data = parent::toArray($request);
        $data['input_items'] = $this->whenLoaded('inputItems', fn () => InputItemResource::collection($this->inputItems)->resolve());
        $data['items'] = $data['input_items'];
        $data['versions'] = $this->whenLoaded('versions', fn () => TopicVersionResource::collection($this->versions)->resolve());
        $data['participants'] = $this->forum?->relationLoaded('participants') ? ForumParticipantResource::collection($this->forum->participants)->resolve() : [];
        return $data;
    }
}
