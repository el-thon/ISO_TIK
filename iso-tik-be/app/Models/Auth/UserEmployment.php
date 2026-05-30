<?php

namespace App\Models\Auth;

use App\Models\Concerns\UsesUuid;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserEmployment extends Model
{
    use HasFactory;
    use SoftDeletes;
    use UsesUuid;

    protected $table = 'auth.user_employments';

    protected $primaryKey = 'id';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'user_id',
        'employee_id',
        'lecturer_id',
        'student_id',
        'faculty',
        'department',
        'study_program',
        'unit',
        'office_location',
        'functional_position',
        'structural_position',
        'rank_grade',
        'employment_status',
        'employment_start_date',
        'employment_end_date',
        'highest_education',
    ];

    protected function casts(): array
    {
        return [
            'employment_start_date' => 'date',
            'employment_end_date' => 'date',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function scopeForUser(Builder $query, string $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('employment_status', 'active');
    }
}
