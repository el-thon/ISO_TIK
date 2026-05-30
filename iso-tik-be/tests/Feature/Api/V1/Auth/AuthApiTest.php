<?php

namespace Tests\Feature\Api\V1\Auth;

use App\Models\Auth\Role;
use App\Models\Auth\LoginHistory;
use App\Models\Auth\UserRole;
use App\Models\System\Setting;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'database.default' => 'pgsql',
            'database.connections.pgsql.host' => env('TEST_DB_HOST', 'postgres'),
            'database.connections.pgsql.port' => env('TEST_DB_PORT', '5432'),
            'database.connections.pgsql.database' => env('TEST_DB_DATABASE', 'iso_tik_be_db'),
            'database.connections.pgsql.username' => env('TEST_DB_USERNAME', 'iso_tik_be_user'),
            'database.connections.pgsql.password' => env('TEST_DB_PASSWORD', 'iso_tik_be_password'),
        ]);

        DB::purge('pgsql');
        DB::connection('pgsql')->getPdo();

        $this->ensureAuthFixtures();
    }

    public function test_user_can_login_with_email_and_valid_password(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'login' => 'auth.admin@iso-tik.test',
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => ['access_token', 'refresh_token', 'token_type', 'user', 'roles'],
                'access_token',
                'refresh_token',
                'token',
                'user',
                'roles',
            ]);

        $this->assertContains('admin', $response->json('roles'));
    }

    public function test_user_cannot_login_with_wrong_password(): void
    {
        $this->postJson('/api/v1/auth/login', [
            'login' => 'auth.admin@iso-tik.test',
            'password' => 'wrong',
        ])->assertUnauthorized()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Invalid credentials');
    }

    public function test_inactive_user_cannot_login(): void
    {
        $this->postJson('/api/v1/auth/login', [
            'login' => 'auth.inactive@iso-tik.test',
            'password' => 'password',
        ])->assertForbidden()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Account is inactive');
    }

    public function test_suspended_user_cannot_login(): void
    {
        $this->postJson('/api/v1/auth/login', [
            'login' => 'auth.suspended@iso-tik.test',
            'password' => 'password',
        ])->assertForbidden()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Account is suspended');
    }

    public function test_account_locked_user_cannot_login(): void
    {
        $this->postJson('/api/v1/auth/login', [
            'login' => 'auth.locked@iso-tik.test',
            'password' => 'password',
        ])->assertForbidden()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Account is locked');
    }

    public function test_wrong_password_increments_failed_attempts_and_locks_after_five_attempts(): void
    {
        $user = User::where('email', 'auth.locktarget@iso-tik.test')->firstOrFail();
        $user->forceFill(['failed_login_attempts' => 0, 'account_locked_at' => null, 'lock_reason' => null])->save();

        for ($attempt = 1; $attempt <= 4; $attempt++) {
            $this->postJson('/api/v1/auth/login', [
                'login' => 'auth.locktarget@iso-tik.test',
                'password' => 'wrong-password',
            ])->assertUnauthorized()
                ->assertJsonPath('message', 'Invalid credentials');
        }

        $this->assertSame(4, $user->fresh()->failed_login_attempts);

        $this->postJson('/api/v1/auth/login', [
            'login' => 'auth.locktarget@iso-tik.test',
            'password' => 'wrong-password',
        ])->assertForbidden()
            ->assertJsonPath('message', 'Account is locked due to too many failed login attempts');

        $this->assertNotNull($user->fresh()->account_locked_at);

        $this->postJson('/api/v1/auth/login', [
            'login' => 'auth.locktarget@iso-tik.test',
            'password' => 'password',
        ])->assertForbidden()
            ->assertJsonPath('message', 'Account is locked');

        $this->assertTrue(LoginHistory::where('user_id', $user->id)
            ->where('status', 'failed')
            ->where('failure_reason', 'account_locked_too_many_failed_attempts')
            ->exists());
    }

    public function test_successful_login_resets_failed_attempts(): void
    {
        $user = User::where('email', 'auth.reset@iso-tik.test')->firstOrFail();
        $user->forceFill(['failed_login_attempts' => 3, 'account_locked_at' => null, 'lock_reason' => null])->save();

        $this->postJson('/api/v1/auth/login', [
            'login' => 'auth.reset@iso-tik.test',
            'password' => 'password',
        ])->assertOk()
            ->assertJsonPath('success', true);

        $user->refresh();
        $this->assertSame(0, $user->failed_login_attempts);
        $this->assertNull($user->account_locked_at);
        $this->assertNotNull($user->last_login_at);

        $this->assertTrue(LoginHistory::where('user_id', $user->id)->where('status', 'success')->exists());
    }

    public function test_auth_me_requires_valid_access_token(): void
    {
        $token = $this->loginAndGetTokens()['access_token'];

        $this->getJson('/api/v1/auth/me', [
            'Authorization' => 'Bearer '.$token,
        ])->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => ['user', 'roles'],
                'user',
                'roles',
            ]);

        $this->getJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_refresh_token_returns_new_access_token(): void
    {
        $tokens = $this->loginAndGetTokens();

        $this->postJson('/api/v1/auth/refresh', [
            'refresh_token' => $tokens['refresh_token'],
        ])->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => ['access_token', 'refresh_token', 'user', 'roles'],
                'access_token',
                'refresh_token',
            ]);

        $this->postJson('/api/v1/auth/refresh', [
            'refresh_token' => 'invalid-token',
        ])->assertUnauthorized()
            ->assertJsonPath('message', 'Invalid refresh token');
    }

    public function test_logout_revokes_access_token(): void
    {
        $tokens = $this->loginAndGetTokens();

        $this->postJson('/api/v1/auth/logout', [], [
            'Authorization' => 'Bearer '.$tokens['access_token'],
        ])->assertOk()
            ->assertJsonPath('message', 'Logout successful');

        $this->getJson('/api/v1/auth/me', [
            'Authorization' => 'Bearer '.$tokens['access_token'],
        ])->assertUnauthorized();
    }

    public function test_otp_required_and_resend_when_setting_enabled(): void
    {
        Setting::updateOrCreate(
            ['key' => 'security.login_otp.enabled'],
            ['value' => true, 'description' => 'Test OTP setting', 'updated_at' => now()]
        );

        $this->postJson('/api/v1/auth/login', [
            'login' => 'auth.admin@iso-tik.test',
            'password' => 'password',
        ])->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('otp_required', true)
            ->assertJsonPath('data.otp_required', true);

        $this->postJson('/api/v1/auth/login/otp/resend', [
            'login' => 'auth.admin@iso-tik.test',
            'password' => 'password',
        ])->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('otp_required', true);

        Setting::where('key', 'security.login_otp.enabled')->update(['value' => false]);
    }

    private function loginAndGetTokens(): array
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'login' => 'auth.admin@iso-tik.test',
            'password' => 'password',
        ]);

        $response->assertOk();

        return [
            'access_token' => $response->json('access_token'),
            'refresh_token' => $response->json('refresh_token'),
        ];
    }

    private function ensureAuthFixtures(): void
    {
        Setting::updateOrCreate(
            ['key' => 'security.login_otp.enabled'],
            ['value' => false, 'description' => 'Test OTP setting', 'updated_at' => now()]
        );

        $adminRole = Role::updateOrCreate(
            ['name' => 'admin'],
            [
                'guard_name' => 'web',
                'display_name' => 'Administrator',
                'description' => 'Auth test admin role',
                'is_system' => true,
            ]
        );

        $activeUser = User::updateOrCreate(
            ['email' => 'auth.admin@iso-tik.test'],
            [
                'name' => 'Auth Admin',
                'username' => 'auth_admin',
                'password_hash' => Hash::make('password'),
                'status' => 'active',
                'failed_login_attempts' => 0,
                'account_locked_at' => null,
                'lock_reason' => null,
                'deleted_at' => null,
            ]
        );

        User::updateOrCreate(
            ['email' => 'auth.inactive@iso-tik.test'],
            [
                'name' => 'Inactive User',
                'username' => 'auth_inactive',
                'password_hash' => Hash::make('password'),
                'status' => 'inactive',
                'failed_login_attempts' => 0,
                'deleted_at' => null,
            ]
        );

        User::updateOrCreate(
            ['email' => 'auth.suspended@iso-tik.test'],
            [
                'name' => 'Suspended User',
                'username' => 'auth_suspended',
                'password_hash' => Hash::make('password'),
                'status' => 'suspended',
                'failed_login_attempts' => 0,
                'account_locked_at' => null,
                'deleted_at' => null,
            ]
        );

        User::updateOrCreate(
            ['email' => 'auth.locked@iso-tik.test'],
            [
                'name' => 'Locked User',
                'username' => 'auth_locked',
                'password_hash' => Hash::make('password'),
                'status' => 'active',
                'failed_login_attempts' => 0,
                'account_locked_at' => now(),
                'deleted_at' => null,
            ]
        );

        User::updateOrCreate(
            ['email' => 'auth.locktarget@iso-tik.test'],
            [
                'name' => 'Lock Target User',
                'username' => 'auth_locktarget',
                'password_hash' => Hash::make('password'),
                'status' => 'active',
                'failed_login_attempts' => 0,
                'account_locked_at' => null,
                'lock_reason' => null,
                'deleted_at' => null,
            ]
        );

        User::updateOrCreate(
            ['email' => 'auth.reset@iso-tik.test'],
            [
                'name' => 'Reset Attempts User',
                'username' => 'auth_reset',
                'password_hash' => Hash::make('password'),
                'status' => 'active',
                'failed_login_attempts' => 3,
                'account_locked_at' => null,
                'lock_reason' => null,
                'deleted_at' => null,
            ]
        );

        UserRole::updateOrCreate(
            ['user_id' => $activeUser->id, 'role_id' => $adminRole->id],
            [
                'assigned_by' => $activeUser->id,
                'assigned_at' => now(),
                'revoked_at' => null,
                'deleted_at' => null,
            ]
        );
    }
}
