<?php

namespace Database\Factories\Content;

use App\Models\Content\InputItem;
use App\Models\Content\Topic;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InputItem>
 */
class InputItemFactory extends Factory
{
    protected $model = InputItem::class;

    public function definition(): array
    {
        return [
            'topic_id' => Topic::factory(),
            'type' => 'finding',
            'label' => 'Temuan',
            'value' => fake()->sentence(),
            'metadata' => [],
            'order_index' => 0,
            'visibility' => 'visible',
            'created_by_user_id' => User::factory(),
        ];
    }
}
