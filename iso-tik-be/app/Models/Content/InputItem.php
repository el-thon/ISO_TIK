<?php

namespace App\Models\Content;

use App\Models\Concerns\UsesUuid;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class InputItem extends Model
{
    use HasFactory;
    use SoftDeletes;
    use UsesUuid;

    protected $table = 'content.input_items';

    protected $primaryKey = 'id';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'topic_id',
        'type',
        'label',
        'value',
        'metadata',
        'order_index',
        'visibility',
        'created_by_user_id',
        'deleted_by_user_id',
        'deletion_reason',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'order_index' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class, 'topic_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function deletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by_user_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class, 'input_item_id');
    }

    public function scopeForTopic(Builder $query, string $topicId): Builder
    {
        return $query->where('topic_id', $topicId);
    }

    public function scopeVisible(Builder $query): Builder
    {
        return $query->where('visibility', 'visible');
    }
}
