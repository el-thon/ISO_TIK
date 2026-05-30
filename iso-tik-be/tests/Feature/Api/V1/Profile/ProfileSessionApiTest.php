<?php

namespace Tests\Feature\Api\V1\Profile;

use Tests\TestCase;
use Illuminate\Support\Facades\DB;

class ProfileSessionApiTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->usePostgres();
    }

    public function test_sessions_login_history_and_alias_routes_work(): void
    {
        $login = $this->postJson('/api/v1/auth/login', [
            'login' => 'admin@iso-tik.test',
            'password' => 'password',
        ]);
        $login->assertOk();
        $token = $login->json('access_token');
        $headers = ['Authorization' => 'Bearer '.$token, 'Accept' => 'application/json'];

        $sessions = $this->getJson('/api/v1/profile/sessions', $headers)
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['sessions', 'items', 'pagination']);

        $this->getJson('/api/v1/profile/security/sessions', $headers)
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->getJson('/api/v1/profile/login-history', $headers)
            ->assertOk()
            ->assertJsonStructure(['login_history', 'histories', 'items']);

        $this->getJson('/api/v1/profile/security/login-history', $headers)
            ->assertOk();

        $sessionId = $sessions->json('sessions.0.id');
        if ($sessionId) {
            $this->deleteJson("/api/v1/profile/sessions/{$sessionId}", ['reason' => 'test'], $headers)
                ->assertOk();
        }

        $login = $this->postJson('/api/v1/auth/login', [
            'login' => 'admin@iso-tik.test',
            'password' => 'password',
        ]);
        $headers = ['Authorization' => 'Bearer '.$login->json('access_token'), 'Accept' => 'application/json'];

        $this->deleteJson('/api/v1/profile/security/sessions', ['reason' => 'test all'], $headers)
            ->assertOk()
            ->assertJsonPath('message', 'All sessions revoked successfully');
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
