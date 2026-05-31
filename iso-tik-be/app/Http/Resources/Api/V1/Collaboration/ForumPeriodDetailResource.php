<?php

namespace App\Http\Resources\Api\V1\Collaboration;

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
        return $data;
    }
}
