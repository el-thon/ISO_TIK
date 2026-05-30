<?php

namespace App\Models\System;

use App\Models\Concerns\UsesUuid;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Setting extends Model
{
    use HasFactory;
    use UsesUuid;

    protected $table = 'system.settings';

    protected $primaryKey = 'id';

    protected $keyType = 'string';

    public $incrementing = false;

    public const CREATED_AT = null;

    protected $fillable = [
        'key',
        'value',
        'description',
        'updated_by',
        'updated_at',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'array',
            'updated_at' => 'datetime',
        ];
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function scopeKey(Builder $query, string $key): Builder
    {
        return $query->where('key', $key);
    }
}
