<?php

namespace App\Http\Requests\Api\V1\Profile;

use App\Http\Requests\Api\V1\BaseApiRequest;

class UpdateEmploymentRequest extends BaseApiRequest
{
    public function rules(): array
    {
        return [
            'employee_id' => ['nullable', 'string', 'max:100'],
            'lecturer_id' => ['nullable', 'string', 'max:100'],
            'student_id' => ['nullable', 'string', 'max:100'],
            'faculty' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'study_program' => ['nullable', 'string', 'max:255'],
            'unit' => ['nullable', 'string', 'max:255'],
            'office_location' => ['nullable', 'string', 'max:255'],
            'functional_position' => ['nullable', 'string', 'max:255'],
            'structural_position' => ['nullable', 'string', 'max:255'],
            'rank_grade' => ['nullable', 'string', 'max:100'],
            'employment_status' => ['nullable', 'string', 'in:active,inactive,contract,permanent,retired'],
            'employment_start_date' => ['nullable', 'date'],
            'employment_end_date' => ['nullable', 'date'],
            'highest_education' => ['nullable', 'string', 'max:255'],
        ];
    }
}
