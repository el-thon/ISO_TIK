<?php

namespace Tests\Feature\Api\V1\User;

use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class UserSearchApiTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->usePostgres();
    }

    public function test_user_search_returns_compatible_keys(): void
    {
        $login = $this->postJson('/api/v1/auth/login', [
            'login' => 'admin@iso-tik.test',
            'password' => 'password',
        ]);
        $login->assertOk();

        $this->getJson('/api/v1/users?search=admin&per_page=10', [
            'Authorization' => 'Bearer '.$login->json('access_token'),
            'Accept' => 'application/json',
        ])->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['users', 'items'], 'users', 'items', 'meta', 'pagination']);
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
