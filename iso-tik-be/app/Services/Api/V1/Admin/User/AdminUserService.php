<?php

namespace App\Services\Api\V1\Admin\User;

use App\Http\Resources\Api\V1\Admin\User\AdminActivityLogResource;
use App\Http\Resources\Api\V1\Admin\User\AdminUserResource;
use App\Models\Auth\LoginHistory;
use App\Models\Auth\Role;
use App\Models\Auth\SessionToken;
use App\Models\Auth\UserAddress;
use App\Models\Auth\UserContact;
use App\Models\Auth\UserEmployment;
use App\Models\Auth\UserProfile;
use App\Models\Auth\UserRole;
use App\Models\Security\AuditLog;
use App\Models\User;
use App\Services\Api\V1\Security\AuditLogService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AdminUserService
{
    public function __construct(private readonly AuditLogService $audit) {}

    public function index(Request $request): JsonResponse
    {
        $search = $request->input('search') ?: $request->input('q') ?: $request->input('keyword');
        $query = User::query()->with('roles', 'profile', 'contact', 'address', 'employment');
        if ($request->boolean('include_deleted') || $request->boolean('trashed')) $query->withTrashed();
        $query->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->input('role'), fn ($q, $r) => $q->whereHas('roles', fn ($rq) => $rq->where('name', $r)))
            ->when($search, function ($q) use ($search) {
                $like = '%'.strtolower($search).'%';
                $q->where(fn ($i) => $i->whereRaw('LOWER(name) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(email) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(username) LIKE ?', [$like])
                    ->orWhereHas('profile', fn ($p) => $p->whereRaw('LOWER(full_name) LIKE ?', [$like]))
                    ->orWhereHas('employment', fn ($e) => $e->whereRaw('LOWER(employee_id) LIKE ?', [$like])->orWhereRaw('LOWER(department) LIKE ?', [$like])->orWhereRaw('LOWER(unit) LIKE ?', [$like])));
            });
        $sort = in_array($request->input('sort'), ['name', 'email', 'username', 'status', 'created_at'], true) ? $request->input('sort') : 'created_at';
        $dir = strtolower($request->input('direction', 'desc')) === 'asc' ? 'asc' : 'desc';
        $paginator = $query->orderBy($sort, $dir)->paginate((int) $request->integer('per_page', 10));
        $items = collect($paginator->items())->map(fn ($u) => (new AdminUserResource($u))->resolve())->values()->all();
        $pagination = $this->pagination($paginator);
        $usersPaginator = array_merge(['data' => $items], $pagination);
        return response()->json(['success' => true, 'message' => 'Users retrieved successfully', 'data' => ['users' => $usersPaginator, 'items' => $items], 'users' => $usersPaginator, 'items' => $items, 'meta' => $pagination, 'pagination' => $pagination]);
    }

    public function store(array $payload, Request $request): JsonResponse
    {
        $password = $payload['password'] ?? 'password';
        if (($payload['password_confirmation'] ?? $password) !== $password) throw ValidationException::withMessages(['password' => ['Password confirmation does not match.']]);
        $user = User::create([
            'name' => $payload['name'] ?? $payload['full_name'] ?? $payload['username'] ?? $payload['email'],
            'email' => $payload['email'],
            'username' => $payload['username'] ?? null,
            'password_hash' => Hash::make($password),
            'status' => $payload['status'] ?? 'active',
            'created_by' => $request->user()?->id,
        ]);
        $this->upsertDetails($user, $payload);
        $this->syncRoles($user, $payload, $request->user());
        $this->audit->record($request->user(), 'user', $user->id, 'create_user', [], $request);
        return $this->userResponse($user, 'User created successfully');
    }

    public function show(string $id): JsonResponse { return $this->userResponse(User::withTrashed()->findOrFail($id), 'User retrieved successfully'); }

    public function update(string $id, array $payload, Request $request): JsonResponse
    {
        $user = User::withTrashed()->findOrFail($id);
        $user->fill(Arr::only($payload, ['name', 'email', 'username', 'status', 'photo_url']));
        if ($payload['password'] ?? null) $user->password_hash = Hash::make($payload['password']);
        $user->updated_by = $request->user()?->id;
        $user->save();
        $this->upsertDetails($user, $payload);
        if (isset($payload['role_id']) || isset($payload['role']) || isset($payload['roles'])) $this->syncRoles($user, $payload, $request->user(), true);
        $this->audit->record($request->user(), 'user', $user->id, 'update_user', [], $request);
        return $this->userResponse($user, 'User updated successfully');
    }

    public function destroy(string $id, Request $request): JsonResponse
    {
        $user = User::findOrFail($id);
        if ($request->user()?->id === $user->id) return ApiResponse::error('Cannot delete current user', 422);
        $user->forceFill(['deleted_by' => $request->user()?->id, 'status' => 'inactive'])->save();
        $user->delete();
        SessionToken::where('user_id', $user->id)->whereNull('revoked_at')->update(['revoked_at' => now(), 'revoke_reason' => 'admin_delete']);
        $this->audit->record($request->user(), 'user', $user->id, 'delete_user', ['reason' => $request->input('reason')], $request);
        return ApiResponse::success([], 'User deleted successfully');
    }

    public function activate(string $id, Request $request): JsonResponse { $u = User::withTrashed()->findOrFail($id); $u->restore(); $u->forceFill(['status' => 'active', 'account_locked_at' => null, 'lock_reason' => null])->save(); $this->audit->record($request->user(), 'user', $u->id, 'activate_user', [], $request); return $this->userResponse($u, 'User activated successfully'); }
    public function deactivate(string $id, Request $request): JsonResponse { $u = User::findOrFail($id); $u->forceFill(['status' => 'inactive', 'lock_reason' => $request->input('reason')])->save(); $this->audit->record($request->user(), 'user', $u->id, 'deactivate_user', ['reason' => $request->input('reason')], $request); return $this->userResponse($u, 'User deactivated successfully'); }
    public function restore(string $id, Request $request): JsonResponse { $u = User::withTrashed()->findOrFail($id); $u->restore(); $u->forceFill(['status' => 'active', 'deleted_by' => null])->save(); return $this->userResponse($u, 'User restored successfully'); }

    public function resetPassword(string $id, array $payload, Request $request): JsonResponse
    {
        $password = $payload['new_password'] ?? $payload['password'] ?? null;
        if (! $password) throw ValidationException::withMessages(['password' => ['Password is required.']]);
        if (($payload['password_confirmation'] ?? $payload['new_password_confirmation'] ?? $password) !== $password) throw ValidationException::withMessages(['password' => ['Password confirmation does not match.']]);
        $u = User::withTrashed()->findOrFail($id); $u->forceFill(['password_hash' => Hash::make($password), 'password_changed_at' => now()])->save();
        $this->audit->record($request->user(), 'user', $u->id, 'reset_password', [], $request);
        return ApiResponse::success([], 'Password reset successfully');
    }

    public function bulkUpdateStatus(array $payload, Request $request): JsonResponse
    {
        $ids = $payload['user_ids'] ?? $payload['ids'] ?? [];
        $status = $payload['status'] ?? 'active';
        $count = User::whereIn('id', $ids)->when($request->user(), fn ($q, $u) => $q->where('id', '!=', $u->id))->update(['status' => $status, 'updated_at' => now()]);
        return ApiResponse::success(['updated' => $count], 'User status updated successfully', 200, ['updated' => $count]);
    }

    public function statistics(): JsonResponse
    {
        $stats = ['total' => User::withTrashed()->count(), 'active' => User::where('status', 'active')->count(), 'inactive' => User::where('status', 'inactive')->count(), 'deleted' => User::onlyTrashed()->count(), 'roles' => []];
        foreach (['admin', 'member', 'product_owner'] as $role) $stats['roles'][$role] = User::whereHas('roles', fn ($q) => $q->where('name', $role))->count();
        return ApiResponse::success(['statistics' => $stats], 'User statistics retrieved successfully', 200, ['statistics' => $stats]);
    }

    public function activityLogs(string $id, Request $request): JsonResponse
    {
        $query = AuditLog::where(fn ($q) => $q->where('actor_user_id', $id)->orWhere(fn ($x) => $x->where('entity_type', 'user')->where('entity_id', $id)));
        if (! $query->exists()) $query = LoginHistory::where('user_id', $id);
        $p = $query->latest($query->getModel() instanceof AuditLog ? 'timestamp' : 'login_at')->paginate((int) $request->integer('per_page', 15));
        $items = collect($p->items())->map(fn ($l) => (new AdminActivityLogResource($l))->resolve())->values()->all();
        $pg = $this->pagination($p);
        return response()->json(['success' => true, 'message' => 'Activity logs retrieved successfully', 'data' => ['activity_logs' => $items, 'activities' => $items, 'logs' => $items, 'items' => $items], 'activity_logs' => $items, 'activities' => $items, 'logs' => $items, 'items' => $items, 'meta' => $pg, 'pagination' => $pg]);
    }

    private function userResponse(User $user, string $message): JsonResponse { $payload = (new AdminUserResource($user->fresh() ?? $user))->resolve(); return ApiResponse::success(['user' => $payload], $message, 200, ['user' => $payload]); }
    private function upsertDetails(User $u, array $p): void { UserProfile::updateOrCreate(['user_id'=>$u->id], array_filter(['full_name'=>$p['full_name'] ?? $p['profile']['full_name'] ?? $u->name, 'deleted_at'=>null], fn($v)=>$v!==null)); UserContact::updateOrCreate(['user_id'=>$u->id], array_filter(['phone_number'=>$p['phone_number'] ?? $p['contact']['phone_number'] ?? null, 'email_institutional'=>$p['contact']['email_institutional'] ?? $p['email'] ?? null, 'email_personal'=>$p['contact']['email_personal'] ?? null, 'deleted_at'=>null], fn($v)=>$v!==null)); UserAddress::updateOrCreate(['user_id'=>$u->id], array_filter(array_merge(Arr::only($p['address'] ?? [], ['address_line1','address_line2','city','province','postal_code','country']), ['deleted_at'=>null]), fn($v)=>$v!==null)); UserEmployment::updateOrCreate(['user_id'=>$u->id], array_filter(array_merge(Arr::only($p, ['employee_id','department','unit']), Arr::only($p['employment'] ?? [], ['employee_id','lecturer_id','student_id','faculty','department','study_program','unit','office_location','functional_position','structural_position','rank_grade','employment_status','employment_start_date','employment_end_date','highest_education']), ['deleted_at'=>null]), fn($v)=>$v!==null)); }
    private function syncRoles(User $u, array $p, ?User $actor, bool $replace = false): void { $roles = collect($p['roles'] ?? [])->map(fn($r)=>is_array($r)?($r['id']??$r['name']??null):$r)->filter()->all(); if ($p['role_id'] ?? null) $roles[]=$p['role_id']; if ($p['role'] ?? null) $roles[]=$p['role']; if (!$roles) $roles=['member']; if ($replace) UserRole::where('user_id',$u->id)->whereNull('revoked_at')->update(['revoked_at'=>now()]); foreach ($roles as $r) { $role = Role::query()->when($this->isUuid((string) $r), fn($q)=>$q->where('id',$r))->orWhere('name',$r)->first(); if ($role) UserRole::updateOrCreate(['user_id'=>$u->id,'role_id'=>$role->id], ['assigned_by'=>$actor?->id ?? $u->id, 'assigned_at'=>now(), 'revoked_at'=>null, 'deleted_at'=>null]); } }
    private function isUuid(string $value): bool { return (bool) preg_match('/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/', $value); }
    private function pagination($p): array { return ['current_page'=>$p->currentPage(),'per_page'=>$p->perPage(),'total'=>$p->total(),'last_page'=>$p->lastPage(),'from'=>$p->firstItem(),'to'=>$p->lastItem()]; }
}
