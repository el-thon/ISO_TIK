<?php
namespace App\Http\Controllers\Api\V1\Admin;
use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Api\V1\Admin\User\{AdminUserAssignRoleRequest,AdminUserBulkUpdateStatusRequest,AdminUserDeleteRequest,AdminUserIndexRequest,AdminUserResetPasswordRequest,AdminUserStoreRequest,AdminUserUpdateRequest};
use App\Services\Api\V1\Admin\User\{AdminUserRoleService,AdminUserService};
use Illuminate\Http\Request;
class AdminUserController extends BaseApiController {
 public function __construct(private readonly AdminUserService $users, private readonly AdminUserRoleService $roles) {}
 public function index(AdminUserIndexRequest $r){return $this->users->index($r);}
 public function store(AdminUserStoreRequest $r){return $this->users->store($r->validated(),$r);}
 public function show(string $userId){return $this->users->show($userId);}
 public function update(AdminUserUpdateRequest $r,string $userId){return $this->users->update($userId,$r->validated(),$r);}
 public function destroy(AdminUserDeleteRequest $r,string $userId){return $this->users->destroy($userId,$r);}
 public function statistics(){return $this->users->statistics();}
 public function bulkUpdateStatus(AdminUserBulkUpdateStatusRequest $r){return $this->users->bulkUpdateStatus($r->validated(),$r);}
 public function roles(string $userId){return $this->roles->userRoles($userId);}
 public function assignRole(AdminUserAssignRoleRequest $r,string $userId){return $this->roles->assign($userId,$r->validated(),$r);}
 public function revokeRole(string $userId,string $roleId){return $this->roles->revoke($userId,$roleId);}
 public function activate(Request $r,string $userId){return $this->users->activate($userId,$r);}
 public function deactivate(Request $r,string $userId){return $this->users->deactivate($userId,$r);}
 public function resetPassword(AdminUserResetPasswordRequest $r,string $userId){return $this->users->resetPassword($userId,$r->validated(),$r);}
 public function restore(Request $r,string $userId){return $this->users->restore($userId,$r);}
 public function activityLogs(Request $r,string $userId){return $this->users->activityLogs($userId,$r);}
}
