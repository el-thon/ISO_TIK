<?php

namespace App\Models;

use App\Models\Auth\LoginHistory;
use App\Models\Auth\OtpCode;
use App\Models\Auth\Role;
use App\Models\Auth\SessionToken;
use App\Models\Auth\UserAddress;
use App\Models\Auth\UserContact;
use App\Models\Auth\UserEmployment;
use App\Models\Auth\UserProfile;
use App\Models\Auth\UserRole;
use App\Models\Collaboration\Forum;
use App\Models\Collaboration\ForumParticipant;
use App\Models\Collaboration\ForumPeriod;
use App\Models\Collaboration\ForumPeriodJoinRequest;
use App\Models\Collaboration\ForumPeriodMember;
use App\Models\Concerns\UsesUuid;
use App\Models\Content\Attachment;
use App\Models\Content\Document;
use App\Models\Content\InputItem;
use App\Models\Content\Topic;
use App\Models\Content\TopicVersion;
use App\Models\Content\UserSignature;
use App\Models\Security\AuditLog;
use App\Models\System\Clause;
use App\Models\System\Setting;
use App\Models\Workflow\WorkflowState;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory;
    use Notifiable;
    use SoftDeletes;
    use UsesUuid;

    protected $table = 'auth.users';

    protected $primaryKey = 'id';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'name',
        'email',
        'username',
        'password_hash',
        'status',
        'photo_url',
        'last_login_at',
        'password_changed_at',
        'failed_login_attempts',
        'account_locked_at',
        'lock_reason',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $hidden = [
        'password_hash',
    ];

    protected function casts(): array
    {
        return [
            'last_login_at' => 'datetime',
            'password_changed_at' => 'datetime',
            'account_locked_at' => 'datetime',
            'failed_login_attempts' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    public function getAuthPassword(): string
    {
        return (string) $this->password_hash;
    }

    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class, 'user_id');
    }

    public function contact(): HasOne
    {
        return $this->hasOne(UserContact::class, 'user_id');
    }

    public function address(): HasOne
    {
        return $this->hasOne(UserAddress::class, 'user_id');
    }

    public function employment(): HasOne
    {
        return $this->hasOne(UserEmployment::class, 'user_id');
    }

    public function userRoles(): HasMany
    {
        return $this->hasMany(UserRole::class, 'user_id');
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'auth.user_roles', 'user_id', 'role_id')
            ->wherePivotNull('revoked_at')
            ->wherePivotNull('deleted_at')
            ->withPivot(['id', 'assigned_by', 'assigned_at', 'revoked_at', 'deleted_at'])
            ->withTimestamps();
    }

    public function loginHistory(): HasMany
    {
        return $this->hasMany(LoginHistory::class, 'user_id');
    }

    public function sessionTokens(): HasMany
    {
        return $this->hasMany(SessionToken::class, 'user_id');
    }

    public function otpCodes(): HasMany
    {
        return $this->hasMany(OtpCode::class, 'user_id');
    }

    public function createdForumPeriods(): HasMany
    {
        return $this->hasMany(ForumPeriod::class, 'created_by_user_id');
    }

    public function forumPeriodMemberships(): HasMany
    {
        return $this->hasMany(ForumPeriodMember::class, 'user_id');
    }

    public function periodJoinRequests(): HasMany
    {
        return $this->hasMany(ForumPeriodJoinRequest::class, 'requester_user_id');
    }

    public function responsibleForums(): HasMany
    {
        return $this->hasMany(Forum::class, 'responsible_user_id');
    }

    public function forumParticipants(): HasMany
    {
        return $this->hasMany(ForumParticipant::class, 'user_id');
    }

    public function topics(): HasMany
    {
        return $this->hasMany(Topic::class, 'created_by_user_id');
    }

    public function inputItems(): HasMany
    {
        return $this->hasMany(InputItem::class, 'created_by_user_id');
    }

    public function topicVersions(): HasMany
    {
        return $this->hasMany(TopicVersion::class, 'changed_by_user_id');
    }

    public function workflowStates(): HasMany
    {
        return $this->hasMany(WorkflowState::class, 'changed_by_user_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class, 'created_by_user_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class, 'uploaded_by_user_id');
    }

    public function signatures(): HasMany
    {
        return $this->hasMany(UserSignature::class, 'user_id');
    }

    public function clausesCreated(): HasMany
    {
        return $this->hasMany(Clause::class, 'created_by_user_id');
    }

    public function settingsUpdated(): HasMany
    {
        return $this->hasMany(Setting::class, 'updated_by');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'actor_user_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    public function scopeLocked(Builder $query): Builder
    {
        return $query->where('status', 'locked');
    }

    public function hasRole(string $role): bool
    {
        return $this->hasAnyRole([$role]);
    }

    public function hasAnyRole(array $roles): bool
    {
        $normalizedRoles = collect($roles)
            ->map(fn ($role) => strtolower((string) $role))
            ->all();

        if ($this->relationLoaded('roles')) {
            return $this->roles
                ->pluck('name')
                ->map(fn ($role) => strtolower((string) $role))
                ->intersect($normalizedRoles)
                ->isNotEmpty();
        }

        return $this->roles()
            ->whereIn('name', $normalizedRoles)
            ->exists();
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    public function isProductOwner(): bool
    {
        return $this->hasRole('product_owner');
    }

    public function isMember(): bool
    {
        return $this->hasRole('member');
    }
}
