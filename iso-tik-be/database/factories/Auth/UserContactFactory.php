<?php

namespace Database\Factories\Auth;

use App\Models\Auth\UserContact;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<UserContact>
 */
class UserContactFactory extends Factory
{
    protected $model = UserContact::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'phone_number' => fake()->phoneNumber(),
            'email_institutional' => fake()->unique()->safeEmail(),
            'email_personal' => fake()->unique()->safeEmail(),
        ];
    }
}
