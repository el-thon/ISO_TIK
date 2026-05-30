<?php

namespace Tests\Feature\Api\V1\Dashboard;

use App\Models\Auth\Role;
use App\Models\Auth\UserRole;
use App\Models\Content\TopicDocumentMaster;
use App\Models\System\Setting;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DashboardStatisticsApiTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->usePostgres();
        Setting::updateOrCreate(['key' => 'security.login_otp.enabled'], ['value' => false, 'description' => 'Dashboard test OTP setting']);
        foreach (['admin' => 'Administrator', 'member' => 'Member', 'product_owner' => 'Product Owner'] as $name => $display) {
            Role::updateOrCreate(['name' => $name], ['guard_name' => 'web', 'display_name' => $display, 'is_system' => true, 'deleted_at' => null]);
        }
        TopicDocumentMaster::updateOrCreate(['document_number' => 'DOC-DASHBOARD-TEST'], ['revision_number' => '01', 'published_at' => '2026-01-01', 'is_active' => true]);
    }

    public function test_authenticated_user_can_read_dashboard_statistics(): void
    {
        $token = $this->tokenFor('dashboard.admin@iso-tik.test', 'dashboard_admin', 'admin');
        $forum = $this->forum($token);
        $this->postJson('/api/v1/forums/'.$forum['id'].'/topics', [
            'title' => 'Dashboard Topic',
            'input_items' => [['type' => 'finding', 'label' => 'Finding', 'value' => 'Major finding', 'metadata' => ['finding_type' => 'major']]],
        ], $this->auth($token))->assertOk();

        $this->getJson('/api/v1/dashboard/statistics?finding_type=major', $this->auth($token))
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => ['statistics', 'my_statistics', 'stats', 'summary', 'cards', 'charts', 'recent_activities', 'recentActivities', 'scope', 'role'],
                'statistics',
                'my_statistics',
                'stats',
                'summary',
                'cards',
                'charts',
                'recent_activities',
                'recentActivities',
            ])
            ->assertJsonPath('success', true);
    }

    public function test_dashboard_filters_do_not_error(): void
    {
        $token = $this->tokenFor('dashboard.filter@iso-tik.test', 'dashboard_filter', 'admin');
        $forum = $this->forum($token);

        $this->getJson('/api/v1/dashboard/statistics?forum_id='.$forum['id'], $this->auth($token))
            ->assertOk()
            ->assertJsonStructure(['data' => ['statistics' => ['forums', 'topics'], 'summary'], 'statistics', 'summary']);

        $this->getJson('/api/v1/dashboard/statistics?period_id='.$forum['forum_period_id'], $this->auth($token))
            ->assertOk()
            ->assertJsonStructure(['data' => ['statistics' => ['periods', 'forums'], 'charts'], 'charts']);
    }

    public function test_member_token_gets_dashboard_without_error(): void
    {
        $token = $this->tokenFor('dashboard.member@iso-tik.test', 'dashboard_member', 'member');

        $response = $this->getJson('/api/v1/dashboard/statistics', $this->auth($token))
            ->assertOk()
            ->assertJsonStructure(['data' => ['statistics', 'stats', 'summary', 'cards', 'charts', 'recent_activities', 'recentActivities', 'my_statistics'], 'statistics', 'stats', 'summary', 'cards', 'charts', 'recent_activities', 'recentActivities', 'my_statistics']);

        $this->assertIsInt($response->json('data.statistics.topics.published'));
        $this->assertIsInt($response->json('data.statistics.topics.in_review'));
    }

    public function test_product_owner_can_read_dashboard_statistics(): void
    {
        $token = $this->tokenFor('dashboard.owner@iso-tik.test', 'dashboard_owner', 'product_owner');

        $this->getJson('/api/v1/dashboard/statistics?mine=true', $this->auth($token))
            ->assertOk()
            ->assertJsonStructure(['data' => ['statistics', 'stats', 'summary', 'cards', 'charts', 'recent_activities', 'recentActivities'], 'statistics', 'stats', 'summary'])
            ->assertJsonPath('success', true);
    }

    public function test_dashboard_statistics_requires_token(): void
    {
        $this->getJson('/api/v1/dashboard/statistics')->assertUnauthorized();
    }

    private function auth(string $token): array
    {
        return ['Authorization' => 'Bearer '.$token, 'Accept' => 'application/json'];
    }

    private function tokenFor(string $email, string $username, string $role): string
    {
        $roleModel = Role::where('name', $role)->firstOrFail();
        $user = User::updateOrCreate(['email' => $email], ['name' => ucfirst(str_replace('_', ' ', $username)), 'username' => $username, 'password_hash' => Hash::make('password'), 'status' => 'active', 'deleted_at' => null]);
        UserRole::updateOrCreate(['user_id' => $user->id, 'role_id' => $roleModel->id], ['assigned_by' => $user->id, 'assigned_at' => now(), 'revoked_at' => null, 'deleted_at' => null]);

        return $this->postJson('/api/v1/auth/login', ['login' => $user->email, 'password' => 'password'])->assertOk()->json('access_token');
    }

    private function forum(string $token): array
    {
        $period = $this->postJson('/api/v1/period', ['name' => 'Dashboard Period '.uniqid(), 'period_type' => 'annual'], $this->auth($token))->assertOk()->json('period');

        return $this->postJson('/api/v1/period/'.$period['id'].'/forums', ['name' => 'Dashboard Forum '.uniqid()], $this->auth($token))->assertOk()->json('forum');
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
