<?php
namespace App\Http\Controllers\Api\V1\Admin;
use App\Http\Controllers\Api\V1\BaseApiController;
use App\Services\Api\V1\Admin\User\AdminUserRoleService;
class AdminRoleController extends BaseApiController { public function __construct(private readonly AdminUserRoleService $roles) {} public function index(){return $this->roles->dropdown();} }
