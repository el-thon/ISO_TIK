<?php

namespace App\Http\Requests\Api\V1\Dashboard;

use App\Http\Requests\Api\V1\BaseApiRequest;

class DashboardStatisticsRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'period_id' => ['nullable', 'string'],
            'forum_id' => ['nullable', 'string'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'finding_type' => ['nullable', 'string'],
            'status' => ['nullable', 'string'],
            'workflow_status' => ['nullable', 'string'],
            'scope' => ['nullable', 'string'],
            'mine' => ['nullable'],
        ];
    }
}
