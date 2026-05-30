<?php

namespace App\Models\Content;

use App\Models\Collaboration\Forum;
use App\Models\Concerns\UsesUuid;
use App\Models\User;
use App\Models\Workflow\WorkflowState;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Topic extends Model
{
    use HasFactory;
    use SoftDeletes;
    use UsesUuid;

    protected $table = 'content.topics';

    protected $primaryKey = 'id';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'forum_id',
        'document_master_id',
        'title',
        'description',
        'status',
        'version_major',
        'version_minor',
        'deadline_at',
        'is_frozen',
        'frozen_until',
        'frozen_by_user_id',
        'created_by_user_id',
        'deleted_by',
        'deletion_reason',
    ];

    protected function casts(): array
    {
        return [
            'version_major' => 'integer',
            'version_minor' => 'integer',
            'deadline_at' => 'datetime',
            'is_frozen' => 'boolean',
            'frozen_until' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    public function forum(): BelongsTo
    {
        return $this->belongsTo(Forum::class, 'forum_id');
    }

    public function documentMaster(): BelongsTo
    {
        return $this->belongsTo(TopicDocumentMaster::class, 'document_master_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function frozenBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'frozen_by_user_id');
    }

    public function deletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    public function inputItems(): HasMany
    {
        return $this->hasMany(InputItem::class, 'topic_id')->orderBy('order_index');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(TopicVersion::class, 'topic_id')->orderByDesc('version_number');
    }

    public function workflowStates(): HasMany
    {
        return $this->hasMany(WorkflowState::class, 'topic_id')->orderByDesc('changed_at');
    }

    public function scopeForForum(Builder $query, string $forumId): Builder
    {
        return $query->where('forum_id', $forumId);
    }

    public function scopeForUser(Builder $query, string $userId): Builder
    {
        return $query->where('created_by_user_id', $userId);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNotIn('status', ['closed']);
    }

    public function scopeArchived(Builder $query): Builder
    {
        return $query->where('status', 'closed');
    }
}
