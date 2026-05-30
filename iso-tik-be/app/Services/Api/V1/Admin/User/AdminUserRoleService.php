<?php

namespace App\Services\Api\V1\Admin\User;

use App\Http\Resources\Api\V1\Admin\User\AdminRoleResource;
use App\Models\Auth\Role;
use App\Models\Auth\UserRole;
use App\Models\User;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUserRoleService
{
    public function dropdown(): JsonResponse
    {
        $roles = Role::query()->orderBy('name')->get()->map(fn ($r) => (new AdminRoleResource($r))->resolve())->values()->all();
        return ApiResponse::success(['roles' => $roles], 'Roles retrieved successfully', 200, ['roles' => $roles]);
    }
    public function userRoles(string $userId): JsonResponse { $u = User::withTrashed()->with('roles')->findOrFail($userId); $roles = $u->roles->map(fn($r)=>(new AdminRoleResource($r))->resolve())->values()->all(); return ApiResponse::success(['roles'=>$roles], 'User roles retrieved successfully', 200, ['roles'=>$roles]); }
    public function assign(string $userId, array $payload, Request $request): JsonResponse { $u=User::withTrashed()->findOrFail($userId); $roleValue=$payload['role_id']??$payload['role']??''; $role=Role::query()->when($this->isUuid((string)$roleValue),fn($q)=>$q->where('id',$roleValue))->orWhere('name',$roleValue)->firstOrFail(); UserRole::updateOrCreate(['user_id'=>$u->id,'role_id'=>$role->id], ['assigned_by'=>$request->user()?->id,'assigned_at'=>now(),'revoked_at'=>null,'deleted_at'=>null]); return $this->userRoles($u->id); }
    public function revoke(string $userId, string $roleId): JsonResponse { $pivot=UserRole::where('user_id',$userId)->where('role_id',$roleId)->whereNull('revoked_at')->first(); if($pivot){$pivot->forceFill(['revoked_at'=>now()])->save();} return $this->userRoles($userId); }
    private function isUuid(string $value): bool { return (bool) preg_match('/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/', $value); }
}
