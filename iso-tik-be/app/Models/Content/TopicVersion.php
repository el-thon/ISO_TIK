<?php

namespace App\Models\Content;

use App\Models\Concerns\UsesUuid;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TopicVersion extends Model
{
    use HasFactory;
    use UsesUuid;

    protected $table = 'content.topic_versions';

    protected $primaryKey = 'id';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'topic_id',
        'version_number',
        'title',
        'description',
        'status',
        'snapshot_data',
        'changed_by_user_id',
        'change_reason',
        'change_type',
    ];

    protected function casts(): array
    {
        return [
            'version_number' => 'integer',
            'snapshot_data' => 'array',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class, 'topic_id');
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by_user_id');
    }

    public function scopeForTopic(Builder $query, string $topicId): Builder
    {
        return $query->where('topic_id', $topicId);
    }
}
