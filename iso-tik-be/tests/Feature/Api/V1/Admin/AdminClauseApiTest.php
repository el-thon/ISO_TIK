<?php

namespace Tests\Feature\Api\V1\Admin;

use App\Models\Auth\Role;
use App\Models\Auth\UserRole;
use App\Models\System\Setting;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminClauseApiTest extends TestCase
{
    private string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->usePostgres();
        Setting::updateOrCreate(['key' => 'security.login_otp.enabled'], ['value' => false, 'description' => 'Admin clause test OTP setting']);
        $this->token = $this->adminToken();
    }

    public function test_admin_can_manage_clauses(): void
    {
        $this->getJson('/api/v1/admin/system/clauses?per_page=10', $this->auth())
            ->assertOk()
            ->assertJsonStructure(['data' => ['clauses', 'items'], 'clauses', 'items', 'meta', 'pagination']);

        $code = 'TEST-'.strtoupper(substr(uniqid(), -6));

        $created = $this->postJson('/api/v1/admin/system/clauses', [
            'code' => $code,
            'name' => 'Test Clause',
            'description' => 'Created by feature test',
            'is_active' => true,
        ], $this->auth())
            ->assertOk()
            ->assertJsonPath('clause.code', $code);

        $clauseId = $created->json('clause.id');

        $this->putJson("/api/v1/admin/system/clauses/{$clauseId}", [
            'code' => $code,
            'name' => 'Test Clause Updated',
            'is_active' => false,
        ], $this->auth())
            ->assertOk()
            ->assertJsonPath('clause.name', 'Test Clause Updated');

        $this->deleteJson("/api/v1/admin/system/clauses/{$clauseId}", [], $this->auth())
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    private function auth(): array
    {
        return ['Authorization' => 'Bearer '.$this->token, 'Accept' => 'application/json'];
    }

    private function adminToken(): string
    {
        $role = Role::updateOrCreate(['name' => 'admin'], ['guard_name' => 'web', 'display_name' => 'Administrator', 'is_system' => true, 'deleted_at' => null]);
        $admin = User::updateOrCreate(
            ['email' => 'admin.clause.api@iso-tik.test'],
            ['name' => 'Admin Clause API', 'username' => 'admin_clause_api', 'password_hash' => Hash::make('password'), 'status' => 'active', 'deleted_at' => null]
        );
        UserRole::updateOrCreate(['user_id' => $admin->id, 'role_id' => $role->id], ['assigned_by' => $admin->id, 'assigned_at' => now(), 'revoked_at' => null, 'deleted_at' => null]);
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
