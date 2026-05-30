<?php

namespace Tests\Feature\Api\V1\Admin;

use App\Models\Auth\Role;
use App\Models\Auth\UserRole;
use App\Models\System\Setting;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminUserApiTest extends TestCase
{
    private string $adminToken;

    private string $memberToken;

    protected function setUp(): void
    {
        parent::setUp();
        $this->usePostgres();
        Setting::updateOrCreate(['key' => 'security.login_otp.enabled'], ['value' => false, 'description' => 'Admin test OTP setting']);
        $this->ensureRoles();
        $this->adminToken = $this->loginToken($this->ensureUser('admin.api@iso-tik.test', 'admin_api', 'admin'));
        $this->memberToken = $this->loginToken($this->ensureUser('member.api@iso-tik.test', 'member_api', 'member'));
    }

    public function test_admin_can_list_users_and_member_is_forbidden(): void
    {
        $this->getJson('/api/v1/admin/users?per_page=10', $this->auth($this->adminToken))
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['users', 'items'], 'users', 'items', 'meta', 'pagination']);

        $this->getJson('/api/v1/admin/users?per_page=10', $this->auth($this->memberToken))
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_admin_user_crud_status_password_roles_and_activity_work(): void
    {
        $email = 'managed.'.uniqid().'@iso-tik.test';

        $created = $this->postJson('/api/v1/admin/users', [
            'name' => 'Managed User',
            'email' => $email,
            'username' => 'managed_'.uniqid(),
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'member',
            'full_name' => 'Managed User Full',
            'employee_id' => 'EMP-'.random_int(1000, 9999),
        ], $this->auth($this->adminToken))
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['user'], 'user']);

        $userId = $created->json('user.id');

        $this->getJson("/api/v1/admin/users/{$userId}", $this->auth($this->adminToken))
            ->assertOk()
            ->assertJsonPath('user.email', $email);

        $this->putJson("/api/v1/admin/users/{$userId}", [
            'name' => 'Managed User Updated',
            'status' => 'active',
            'department' => 'Quality',
        ], $this->auth($this->adminToken))
            ->assertOk()
            ->assertJsonPath('user.name', 'Managed User Updated');

        $this->patchJson("/api/v1/admin/users/{$userId}/deactivate", ['reason' => 'test'], $this->auth($this->adminToken))
            ->assertOk()
            ->assertJsonPath('user.status', 'inactive');

        $this->patchJson("/api/v1/admin/users/{$userId}/activate", [], $this->auth($this->adminToken))
            ->assertOk()
            ->assertJsonPath('user.status', 'active');

        $this->postJson("/api/v1/admin/users/{$userId}/reset-password", [
            'password' => 'password',
            'password_confirmation' => 'password',
        ], $this->auth($this->adminToken))
            ->assertOk()
            ->assertJsonPath('success', true);

        $adminRole = Role::where('name', 'admin')->firstOrFail();

        $this->postJson("/api/v1/admin/users/{$userId}/assign-role", [
            'role_id' => $adminRole->id,
        ], $this->auth($this->adminToken))
            ->assertOk()
            ->assertJsonStructure(['roles']);

        $this->getJson("/api/v1/admin/users/{$userId}/roles", $this->auth($this->adminToken))
            ->assertOk()
            ->assertJsonStructure(['data' => ['roles'], 'roles']);

        $this->deleteJson("/api/v1/admin/users/{$userId}/roles/{$adminRole->id}", [], $this->auth($this->adminToken))
            ->assertOk()
            ->assertJsonStructure(['roles']);

        $this->getJson("/api/v1/admin/users/{$userId}/activity-logs", $this->auth($this->adminToken))
            ->assertOk()
            ->assertJsonStructure(['data' => ['activity_logs', 'logs', 'items'], 'activity_logs', 'logs', 'items']);

        $this->deleteJson("/api/v1/admin/users/{$userId}", ['reason' => 'test cleanup'], $this->auth($this->adminToken))
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->postJson("/api/v1/admin/users/{$userId}/restore", [], $this->auth($this->adminToken))
            ->assertOk()
            ->assertJsonPath('user.status', 'active');
    }

    public function test_statistics_and_bulk_status_work(): void
    {
        $target = $this->ensureUser('bulk.api@iso-tik.test', 'bulk_api', 'member');

        $this->getJson('/api/v1/admin/users/statistics', $this->auth($this->adminToken))
            ->assertOk()
            ->assertJsonStructure(['data' => ['statistics'], 'statistics']);

        $this->postJson('/api/v1/admin/users/bulk-update-status', [
            'user_ids' => [$target->id],
            'status' => 'inactive',
            'reason' => 'test bulk',
        ], $this->auth($this->adminToken))
            ->assertOk()
            ->assertJsonPath('updated', 1);
    }

    private function auth(string $token): array
    {
        return ['Authorization' => 'Bearer '.$token, 'Accept' => 'application/json'];
    }

    private function loginToken(User $user): string
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'login' => $user->email,
            'password' => 'password',
        ]);
        $response->assertOk();

        return $response->json('access_token');
    }

    private function ensureUser(string $email, string $username, string $roleName): User
    {
        $role = Role::where('name', $roleName)->firstOrFail();
        $user = User::updateOrCreate(
            ['email' => $email],
            ['name' => ucfirst(str_replace('_', ' ', $username)), 'username' => $username, 'password_hash' => Hash::make('password'), 'status' => 'active', 'deleted_at' => null]
        );
        UserRole::updateOrCreate(['user_id' => $user->id, 'role_id' => $role->id], ['assigned_by' => $user->id, 'assigned_at' => now(), 'revoked_at' => null, 'deleted_at' => null]);

        return $user;
    }

    private function ensureRoles(): void
    {
        foreach (['admin' => 'Administrator', 'member' => 'Member', 'product_owner' => 'Product Owner'] as $name => $display) {
            Role::updateOrCreate(['name' => $name], ['guard_name' => 'web', 'display_name' => $display, 'is_system' => true, 'deleted_at' => null]);
        }
    }

    private function usePostgres(): void
    {
        config([
            'database.default' => 'pgsql',
            'database.connections.pgsql.host' => env('TEST_DB_HOST', 'postgres'),
            'database.connections.pgsql.port' => env('TEST_DB_PORT', '5432'),
            'database.connections.pgsql.database' => env('TEST_DB_DATABASE', 'iso_tik_be_db'),
            'database.connections.pgsql.username' => env('TEST_DB_USERNAME', 'iso_tik_be_user'),
            'database.connections.pgsql.password' => env('TEST_DB_PASSWORD', 'iso_tik_be_password'),
        ]);
        DB::purge('pgsql');
    }
}
