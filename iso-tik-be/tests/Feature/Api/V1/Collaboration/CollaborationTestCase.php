<?php

namespace Tests\Feature\Api\V1\Collaboration;

use App\Models\Auth\Role;
use App\Models\Auth\UserRole;
use App\Models\System\Setting;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

abstract class CollaborationTestCase extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->usePostgres();
        Setting::updateOrCreate(['key' => 'security.login_otp.enabled'], ['value' => false, 'description' => 'Collaboration test OTP setting']);
        foreach (['admin' => 'Administrator', 'member' => 'Member', 'product_owner' => 'Product Owner'] as $name => $display) {
            Role::updateOrCreate(['name' => $name], ['guard_name' => 'web', 'display_name' => $display, 'is_system' => true, 'deleted_at' => null]);
        }
    }

    protected function auth(string $token): array
    {
        return ['Authorization' => 'Bearer '.$token, 'Accept' => 'application/json'];
    }

    protected function tokenFor(string $email, string $username, string $role = 'member'): string
    {
        $user = $this->user($email, $username, $role);
        $response = $this->postJson('/api/v1/auth/login', ['login' => $user->email, 'password' => 'password']);
        $response->assertOk();

        return $response->json('access_token');
    }

    protected function user(string $email, string $username, string $role = 'member'): User
    {
        $roleModel = Role::where('name', $role)->firstOrFail();
        $user = User::updateOrCreate(
            ['email' => $email],
            ['name' => ucfirst(str_replace('_', ' ', $username)), 'username' => $username, 'password_hash' => Hash::make('password'), 'status' => 'active', 'deleted_at' => null]
        );
        UserRole::updateOrCreate(['user_id' => $user->id, 'role_id' => $roleModel->id], ['assigned_by' => $user->id, 'assigned_at' => now(), 'revoked_at' => null, 'deleted_at' => null]);

        return $user;
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
