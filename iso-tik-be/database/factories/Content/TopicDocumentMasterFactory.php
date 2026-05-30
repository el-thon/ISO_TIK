<?php

namespace Database\Factories\Content;

use App\Models\Content\TopicDocumentMaster;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TopicDocumentMaster>
 */
class TopicDocumentMasterFactory extends Factory
{
    protected $model = TopicDocumentMaster::class;

    public function definition(): array
    {
        return [
            'document_number' => 'FRM-POS-UPA TIK-SMKI-' . fake()->unique()->numerify('###-##'),
            'published_at' => now()->toDateString(),
            'revision_number' => '00',
            'is_active' => false,
        ];
    }
}
