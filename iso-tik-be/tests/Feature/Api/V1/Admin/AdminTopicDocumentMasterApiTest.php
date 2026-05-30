<?php

namespace Tests\Feature\Api\V1\Admin;

use App\Models\Auth\Role;
use App\Models\Auth\UserRole;
use App\Models\System\Setting;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminTopicDocumentMasterApiTest extends TestCase
{
    private string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->usePostgres();
        Setting::updateOrCreate(['key' => 'security.login_otp.enabled'], ['value' => false, 'description' => 'Admin master test OTP setting']);
        $this->token = $this->adminToken();
    }

    public function test_admin_can_manage_topic_document_masters_and_read_active_master(): void
    {
        $this->getJson('/api/v1/admin/topic-document-masters?per_page=10', $this->auth())
            ->assertOk()
            ->assertJsonStructure(['data', 'topic_document_masters', 'masters', 'items', 'meta', 'pagination']);

        $number = 'DOC-TEST-'.strtoupper(substr(uniqid(), -6));

        $created = $this->postJson('/api/v1/admin/topic-document-masters', [
            'document_number' => $number,
            'revision_number' => '01',
            'published_at' => '2026-01-01',
            'is_active' => true,
        ], $this->auth())
            ->assertOk()
            ->assertJsonPath('topic_document_master.document_number', $number);

        $id = $created->json('topic_document_master.id');

        $this->putJson("/api/v1/admin/topic-document-masters/{$id}", [
            'id' => $id,
            'document_number' => $number,
            'revision_number' => '02',
            'is_active' => true,
        ], $this->auth())
            ->assertOk()
            ->assertJsonPath('topic_document_master.revision_number', '02');

        $this->getJson('/api/v1/topic-document-masters/active', $this->auth())
            ->assertOk()
            ->assertJsonStructure(['data', 'topic_document_master', 'master']);

        $this->deleteJson("/api/v1/admin/topic-document-masters/{$id}", [], $this->auth())
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_authenticated_member_can_read_topic_document_masters(): void
    {
        $memberToken = $this->roleToken('member', 'member.master.api@iso-tik.test', 'member_master_api');

        $this->getJson('/api/v1/admin/topic-document-masters?per_page=10', [
            'Authorization' => 'Bearer '.$memberToken,
            'Accept' => 'application/json',
        ])
            ->assertOk()
            ->assertJsonStructure(['data', 'topic_document_masters', 'masters', 'items', 'meta', 'pagination']);
    }

    private function auth(): array
    {
        return ['Authorization' => 'Bearer '.$this->token, 'Accept' => 'application/json'];
    }

    private function adminToken(): string
    {
        return $this->roleToken('admin', 'admin.master.api@iso-tik.test', 'admin_master_api');
    }

    private function roleToken(string $roleName, string $email, string $username): string
    {
        $role = Role::updateOrCreate(
            ['name' => $roleName],
            [
                'guard_name' => 'web',
                'display_name' => ucwords(str_replace('_', ' ', $roleName)),
                'is_system' => true,
                'deleted_at' => null,
            ]
        );

        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => ucwords(str_replace('_', ' ', $username)),
                'username' => $username,
                'password_hash' => Hash::make('password'),
                'status' => 'active',
                'deleted_at' => null,
            ]
        );

        UserRole::updateOrCreate(
            ['user_id' => $user->id, 'role_id' => $role->id],
            ['assigned_by' => $user->id, 'assigned_at' => now(), 'revoked_at' => null, 'deleted_at' => null]
        );

        $response = $this->postJson('/api/v1/auth/login', ['login' => $user->email, 'password' => 'password']);
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
