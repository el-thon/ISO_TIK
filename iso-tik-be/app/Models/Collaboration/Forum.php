<?php

namespace App\Models\Collaboration;

use App\Models\Concerns\UsesUuid;
use App\Models\Content\Attachment;
use App\Models\Content\Topic;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Forum extends Model
{
    use HasFactory;
    use SoftDeletes;
    use UsesUuid;

    protected $table = 'collaboration.forums';

    protected $primaryKey = 'id';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'forum_period_id',
        'name',
        'description',
        'is_locked',
        'is_archived',
        'visibility',
        'responsible_user_id',
        'join_code',
        'is_join_code_active',
        'deleted_by',
    ];

    protected function casts(): array
    {
        return [
            'is_locked' => 'boolean',
            'is_archived' => 'boolean',
            'is_join_code_active' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    public function period(): BelongsTo
    {
        return $this->belongsTo(ForumPeriod::class, 'forum_period_id');
    }

    public function responsibleUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responsible_user_id');
    }

    public function deletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    public function participants(): HasMany
    {
        return $this->hasMany(ForumParticipant::class, 'forum_id');
    }

    public function topics(): HasMany
    {
        return $this->hasMany(Topic::class, 'forum_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class, 'forum_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_archived', false);
    }

    public function scopeArchived(Builder $query): Builder
    {
        return $query->where('is_archived', true);
    }

    public function scopeForPeriod(Builder $query, string $periodId): Builder
    {
        return $query->where('forum_period_id', $periodId);
    }
}
