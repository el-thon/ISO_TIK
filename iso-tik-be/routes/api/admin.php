<?php
use App\Http\Controllers\Api\V1\Admin\{AdminClauseController,AdminRoleController,AdminSystemController,AdminTopicDocumentMasterController,AdminUserController};
use Illuminate\Support\Facades\Route;
Route::middleware(['api.token'])->group(function () {
 Route::get('/admin/topic-document-masters', [AdminTopicDocumentMasterController::class,'index']);
 Route::prefix('admin')->middleware('role:admin,product_owner')->group(function () {
  Route::get('/users', [AdminUserController::class,'index']);
  Route::get('/users/statistics', [AdminUserController::class,'statistics']);
  Route::post('/users/bulk-update-status', [AdminUserController::class,'bulkUpdateStatus'])->middleware('role:admin');
  Route::post('/users', [AdminUserController::class,'store'])->middleware('role:admin');
  Route::get('/users/{userId}', [AdminUserController::class,'show']);
  Route::put('/users/{userId}', [AdminUserController::class,'update'])->middleware('role:admin');
  Route::delete('/users/{userId}', [AdminUserController::class,'destroy'])->middleware('role:admin');
  Route::get('/users/{userId}/roles', [AdminUserController::class,'roles']);
  Route::post('/users/{userId}/assign-role', [AdminUserController::class,'assignRole'])->middleware('role:admin');
  Route::delete('/users/{userId}/roles/{roleId}', [AdminUserController::class,'revokeRole'])->middleware('role:admin');
  Route::patch('/users/{userId}/activate', [AdminUserController::class,'activate'])->middleware('role:admin');
  Route::patch('/users/{userId}/deactivate', [AdminUserController::class,'deactivate'])->middleware('role:admin');
  Route::post('/users/{userId}/reset-password', [AdminUserController::class,'resetPassword'])->middleware('role:admin');
  Route::post('/users/{userId}/restore', [AdminUserController::class,'restore'])->middleware('role:admin');
  Route::get('/users/{userId}/activity-logs', [AdminUserController::class,'activityLogs']);
  Route::get('/rbac/roles', [AdminRoleController::class,'index']);
  Route::get('/system/settings', [AdminSystemController::class,'settings']);
  Route::put('/system/settings', [AdminSystemController::class,'updateSettings'])->middleware('role:admin');
  Route::get('/system/clauses', [AdminClauseController::class,'index']);
  Route::post('/system/clauses', [AdminClauseController::class,'store'])->middleware('role:admin');
  Route::put('/system/clauses/{clauseId}', [AdminClauseController::class,'update'])->middleware('role:admin');
  Route::delete('/system/clauses/{clauseId}', [AdminClauseController::class,'destroy'])->middleware('role:admin');
  Route::post('/topic-document-masters', [AdminTopicDocumentMasterController::class,'store'])->middleware('role:admin');
  Route::put('/topic-document-masters/{id}', [AdminTopicDocumentMasterController::class,'update'])->middleware('role:admin');
  Route::delete('/topic-document-masters/{id}', [AdminTopicDocumentMasterController::class,'destroy'])->middleware('role:admin');
 });
 Route::get('/topic-document-masters/active', [AdminTopicDocumentMasterController::class,'active']);
});
