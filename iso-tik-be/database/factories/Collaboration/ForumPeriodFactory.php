<?php

namespace Database\Factories\Collaboration;

use App\Models\Collaboration\ForumPeriod;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ForumPeriod>
 */
class ForumPeriodFactory extends Factory
{
    protected $model = ForumPeriod::class;

    public function definition(): array
    {
        return [
            'name' => 'Periode Audit ' . now()->year,
            'period_type' => 'annual',
            'start_date' => now()->startOfYear()->toDateString(),
            'end_date' => now()->endOfYear()->toDateString(),
            'join_code' => strtoupper(fake()->bothify('PER###')),
            'is_join_code_active' => true,
            'created_by_user_id' => User::factory(),
        ];
    }
}
