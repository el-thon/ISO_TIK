<?php

namespace App\Http\Resources\Api\V1\Collaboration;

use Illuminate\Http\Request;

class ForumDetailResource extends ForumResource
{
    public function toArray(Request $request): array
    {
        $data = parent::toArray($request);
        $data['participants'] = $this->whenLoaded('participants', fn () => ForumParticipantResource::collection($this->participants)->resolve());
        return $data;
    }
}
