<?php

namespace App\Models\Workflow;

use App\Models\Concerns\UsesUuid;
use App\Models\Content\Topic;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowState extends Model
{
    use HasFactory;
    use UsesUuid;

    protected $table = 'workflow.workflow_states';

    protected $primaryKey = 'id';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'topic_id',
        'from_status',
        'to_status',
        'reason',
        'changed_by_user_id',
        'changed_at',
    ];

    protected function casts(): array
    {
        return [
            'changed_at' => 'datetime',
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
