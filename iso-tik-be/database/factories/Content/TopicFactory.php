<?php

namespace Database\Factories\Content;

use App\Models\Collaboration\Forum;
use App\Models\Content\Topic;
use App\Models\Content\TopicDocumentMaster;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Topic>
 */
class TopicFactory extends Factory
{
    protected $model = Topic::class;

    public function definition(): array
    {
        return [
            'forum_id' => Forum::factory(),
            'document_master_id' => TopicDocumentMaster::factory(),
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'status' => 'draft',
            'version_major' => 1,
            'version_minor' => 0,
            'deadline_at' => now()->addMonth(),
            'is_frozen' => false,
            'created_by_user_id' => User::factory(),
        ];
    }
}
