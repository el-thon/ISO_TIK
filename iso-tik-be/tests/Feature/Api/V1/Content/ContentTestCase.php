<?php

namespace Tests\Feature\Api\V1\Content;

use App\Models\Auth\Role;
use App\Models\Auth\UserRole;
use App\Models\Content\TopicDocumentMaster;
use App\Models\System\Setting;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

abstract class ContentTestCase extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->usePostgres();
        Setting::updateOrCreate(['key' => 'security.login_otp.enabled'], ['value' => false, 'description' => 'Content test OTP setting']);
        foreach (['admin' => 'Administrator', 'member' => 'Member', 'product_owner' => 'Product Owner'] as $name => $display) {
            Role::updateOrCreate(['name' => $name], ['guard_name' => 'web', 'display_name' => $display, 'is_system' => true, 'deleted_at' => null]);
        }
        TopicDocumentMaster::updateOrCreate(['document_number' => 'DOC-CONTENT-TEST'], ['revision_number' => '01', 'published_at' => '2026-01-01', 'is_active' => true]);
    }

    protected function auth(string $token): array
    {
        return ['Authorization' => 'Bearer '.$token, 'Accept' => 'application/json'];
    }

    protected function tokenFor(string $email, string $username, string $role = 'admin'): string
    {
        $user = $this->user($email, $username, $role);
        $response = $this->postJson('/api/v1/auth/login', ['login' => $user->email, 'password' => 'password']);
        $response->assertOk();
        return $response->json('access_token');
    }

    protected function user(string $email, string $username, string $role = 'member'): User
    {
        $roleModel = Role::where('name', $role)->firstOrFail();
        $user = User::updateOrCreate(['email' => $email], ['name' => ucfirst(str_replace('_', ' ', $username)), 'username' => $username, 'password_hash' => Hash::make('password'), 'status' => 'active', 'deleted_at' => null]);
        UserRole::updateOrCreate(['user_id' => $user->id, 'role_id' => $roleModel->id], ['assigned_by' => $user->id, 'assigned_at' => now(), 'revoked_at' => null, 'deleted_at' => null]);
        return $user;
    }

    protected function forum(string $token): array
    {
        $period = $this->postJson('/api/v1/period', ['name' => 'Content Period '.uniqid(), 'period_type' => 'annual'], $this->auth($token))->assertOk()->json('period');
        return $this->postJson('/api/v1/period/'.$period['id'].'/forums', ['name' => 'Content Forum '.uniqid()], $this->auth($token))->assertOk()->json('forum');
    }

    protected function topic(string $token): array
    {
        $forum = $this->forum($token);
        return $this->postJson('/api/v1/forums/'.$forum['id'].'/topics', ['title' => 'Content Topic '.uniqid(), 'input_items' => [['type' => 'finding', 'label' => 'Finding', 'value' => 'Initial finding']]], $this->auth($token))->assertOk()->json('topic');
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
