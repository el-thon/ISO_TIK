<?php

namespace Database\Factories\Collaboration;

use App\Models\Collaboration\Forum;
use App\Models\Collaboration\ForumPeriod;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Forum>
 */
class ForumFactory extends Factory
{
    protected $model = Forum::class;

    public function definition(): array
    {
        return [
            'forum_period_id' => ForumPeriod::factory(),
            'name' => 'Forum Audit ' . fake()->company(),
            'description' => fake()->sentence(),
            'is_locked' => false,
            'is_archived' => false,
            'visibility' => 'period',
            'responsible_user_id' => User::factory(),
            'join_code' => strtoupper(fake()->bothify('FRM###')),
            'is_join_code_active' => true,
        ];
    }
}
