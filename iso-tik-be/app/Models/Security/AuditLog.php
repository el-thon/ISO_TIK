<?php

namespace App\Models\Security;

use App\Models\Concerns\UsesUuid;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;
    use UsesUuid;

    protected $table = 'security.audit_logs';

    protected $primaryKey = 'id';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'actor_user_id',
        'entity_type',
        'entity_id',
        'action',
        'severity',
        'category',
        'details',
        'ip_address',
        'user_agent',
        'timestamp',
    ];

    protected function casts(): array
    {
        return [
            'details' => 'array',
            'timestamp' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }

    public function scopeForUser(Builder $query, string $userId): Builder
    {
        return $query->where('actor_user_id', $userId);
    }

    public function scopeForEntity(Builder $query, string $entityType, string $entityId): Builder
    {
        return $query->where('entity_type', $entityType)->where('entity_id', $entityId);
    }
}
