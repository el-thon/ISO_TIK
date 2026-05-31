<?php

namespace App\Http\Resources\Api\V1\Collaboration;

use App\Http\Resources\Api\V1\UserResource;
use Illuminate\Http\Request;

class ForumPeriodDetailResource extends ForumPeriodResource
{
    public function toArray(Request $request): array
    {
        $data = parent::toArray($request);
        $user = $request->user();
        $data['user_membership'] = $user ? $this->members->firstWhere('user_id', $user->id) : null;
        $data['user_join_request'] = $user ? $this->joinRequests->where('requester_user_id', $user->id)->sortByDesc('created_at')->first() : null;
        $data['my_join_request'] = $data['user_join_request'];
        $data['members'] = $this->members
            ->filter(fn ($member) => $member->deleted_at === null)
            ->values()
            ->map(fn ($member) => [
                'id' => $member->id,
                'forum_period_id' => $member->forum_period_id,
                'user_id' => $member->user_id,
                'role' => $member->role,
                'added_by' => $member->added_by,
                'added_at' => optional($member->added_at)->toISOString(),
                'user' => $member->relationLoaded('user') && $member->user ? (new UserResource($member->user))->resolve($request) : null,
                'created_at' => optional($member->created_at)->toISOString(),
                'updated_at' => optional($member->updated_at)->toISOString(),
            ])
            ->all();
        return $data;
    }
}
