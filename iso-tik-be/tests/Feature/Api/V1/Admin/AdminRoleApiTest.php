<?php

namespace Tests\Feature\Api\V1\Admin;

use App\Models\Auth\Role;
use App\Models\Auth\UserRole;
use App\Models\System\Setting;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminRoleApiTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->usePostgres();
        Setting::updateOrCreate(['key' => 'security.login_otp.enabled'], ['value' => false, 'description' => 'Admin role test OTP setting']);
    }

    public function test_roles_dropdown_returns_seeded_global_roles(): void
    {
        $token = $this->adminToken();

        $this->getJson('/api/v1/admin/rbac/roles', ['Authorization' => 'Bearer '.$token, 'Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['roles'], 'roles'])
            ->assertJsonFragment(['name' => 'admin'])
            ->assertJsonFragment(['name' => 'member'])
            ->assertJsonFragment(['name' => 'product_owner']);
    }

    private function adminToken(): string
    {
        foreach (['admin' => 'Administrator', 'member' => 'Member', 'product_owner' => 'Product Owner'] as $name => $display) {
            Role::updateOrCreate(['name' => $name], ['guard_name' => 'web', 'display_name' => $display, 'is_system' => true, 'deleted_at' => null]);
        }

        $admin = User::updateOrCreate(
            ['email' => 'admin.role.api@iso-tik.test'],
            ['name' => 'Admin Role API', 'username' => 'admin_role_api', 'password_hash' => Hash::make('password'), 'status' => 'active', 'deleted_at' => null]
        );
        UserRole::updateOrCreate(['user_id' => $admin->id, 'role_id' => Role::where('name', 'admin')->firstOrFail()->id], ['assigned_by' => $admin->id, 'assigned_at' => now(), 'revoked_at' => null, 'deleted_at' => null]);

        $response = $this->postJson('/api/v1/auth/login', ['login' => $admin->email, 'password' => 'password']);
        $response->assertOk();

        return $response->json('access_token');
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
