<?php

namespace Database\Factories\Auth;

use App\Models\Auth\UserEmployment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<UserEmployment>
 */
class UserEmploymentFactory extends Factory
{
    protected $model = UserEmployment::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'employee_id' => fake()->numerify('EMP-#####'),
            'faculty' => 'UPA TIK',
            'department' => 'Teknologi Informasi',
            'unit' => 'ISO TIK',
            'functional_position' => fake()->jobTitle(),
            'employment_status' => 'active',
            'employment_start_date' => now()->subYears(2)->toDateString(),
            'highest_education' => 'S1',
        ];
    }
}
