<?php

namespace App\Models\Collaboration;

use App\Models\Concerns\UsesUuid;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ForumParticipant extends Model
{
    use HasFactory;
    use SoftDeletes;
    use UsesUuid;

    protected $table = 'collaboration.forum_participants';

    protected $primaryKey = 'id';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'forum_id',
        'user_id',
        'role',
        'is_responsible_user',
        'added_by',
        'added_at',
        'removed_at',
        'removed_by',
        'remove_reason',
    ];

    protected function casts(): array
    {
        return [
            'is_responsible_user' => 'boolean',
            'added_at' => 'datetime',
            'removed_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    public function forum(): BelongsTo
    {
        return $this->belongsTo(Forum::class, 'forum_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function addedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'added_by');
    }

    public function removedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'removed_by');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('removed_at');
    }

    public function scopeForForum(Builder $query, string $forumId): Builder
    {
        return $query->where('forum_id', $forumId);
    }

    public function scopeForUser(Builder $query, string $userId): Builder
    {
        return $query->where('user_id', $userId);
    }
}
