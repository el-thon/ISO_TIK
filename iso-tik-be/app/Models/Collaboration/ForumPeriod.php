<?php

namespace App\Models\Collaboration;

use App\Models\Concerns\UsesUuid;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ForumPeriod extends Model
{
    use HasFactory;
    use SoftDeletes;
    use UsesUuid;

    protected $table = 'collaboration.forum_periods';

    protected $primaryKey = 'id';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'name',
        'period_type',
        'start_date',
        'end_date',
        'join_code',
        'is_join_code_active',
        'created_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'is_join_code_active' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(ForumPeriodMember::class, 'forum_period_id');
    }

    public function joinRequests(): HasMany
    {
        return $this->hasMany(ForumPeriodJoinRequest::class, 'forum_period_id');
    }

    public function forums(): HasMany
    {
        return $this->hasMany(Forum::class, 'forum_period_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where(function (Builder $query): void {
            $query->whereNull('end_date')->orWhere('end_date', '>=', now()->toDateString());
        });
    }
}
