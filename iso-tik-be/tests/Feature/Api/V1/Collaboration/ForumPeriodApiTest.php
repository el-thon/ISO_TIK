<?php

namespace Tests\Feature\Api\V1\Collaboration;

class ForumPeriodApiTest extends CollaborationTestCase
{
    public function test_period_lifecycle_join_request_and_forum_by_period_work(): void
    {
        $adminToken = $this->tokenFor('collab.admin@iso-tik.test', 'collab_admin', 'admin');
        $memberToken = $this->tokenFor('collab.member@iso-tik.test', 'collab_member', 'member');

        $this->getJson('/api/v1/period?per_page=10', $this->auth($memberToken))
            ->assertOk()
            ->assertJsonStructure(['data' => ['periods', 'items'], 'periods', 'items', 'meta', 'pagination']);

        $created = $this->postJson('/api/v1/period', [
            'name' => 'Period API '.uniqid(),
            'period_type' => 'annual',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'join_code' => 'PER'.strtoupper(substr(uniqid(), -6)),
            'is_join_code_active' => true,
        ], $this->auth($adminToken))
            ->assertOk()
            ->assertJsonStructure(['data' => ['period'], 'period']);

        $period = $created->json('period');

        $this->putJson('/api/v1/period/'.$period['id'], ['name' => $period['name'].' Updated'], $this->auth($adminToken))
            ->assertOk()
            ->assertJsonPath('period.name', $period['name'].' Updated');

        $this->postJson('/api/v1/period/join', [
            'period_id' => $period['id'],
            'join_code' => $period['join_code'],
        ], $this->auth($memberToken))
            ->assertOk()
            ->assertJsonStructure(['data' => ['period', 'join_request', 'member'], 'period', 'join_request', 'member']);

        $this->getJson('/api/v1/period/'.$period['id'].'/join-requests?per_page=10', $this->auth($adminToken))
            ->assertOk()
            ->assertJsonStructure(['data' => ['requests', 'items'], 'requests', 'items', 'meta', 'pagination']);

        $forum = $this->postJson('/api/v1/period/'.$period['id'].'/forums', [
            'name' => 'Forum API '.uniqid(),
            'description' => 'Forum created by period test',
            'join_code' => 'FRM'.strtoupper(substr(uniqid(), -6)),
            'is_join_code_active' => true,
        ], $this->auth($adminToken))
            ->assertOk()
            ->assertJsonStructure(['data' => ['forum', 'room'], 'forum', 'room'])
            ->json('forum');

        $this->getJson('/api/v1/period/'.$period['id'].'/forums?per_page=10', $this->auth($memberToken))
            ->assertOk()
            ->assertJsonFragment(['id' => $forum['id']])
            ->assertJsonStructure(['data' => ['forums', 'rooms', 'items'], 'forums', 'rooms', 'items']);
    }

    public function test_period_create_and_update_are_admin_only(): void
    {
        $adminToken = $this->tokenFor('period.admin@iso-tik.test', 'period_admin', 'admin');
        $memberToken = $this->tokenFor('period.member@iso-tik.test', 'period_member', 'member');
        $ownerToken = $this->tokenFor('period.owner@iso-tik.test', 'period_owner', 'product_owner');

        $payload = [
            'name' => 'Admin Only Period '.uniqid(),
            'period_type' => 'annual',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'join_code' => 'ADM'.strtoupper(substr(uniqid(), -6)),
            'is_join_code_active' => true,
        ];

        $this->postJson('/api/v1/period', $payload, $this->auth($memberToken))
            ->assertForbidden()
            ->assertJsonPath('message', 'Only admin can manage periods');

        $this->postJson('/api/v1/period', $payload, $this->auth($ownerToken))
            ->assertForbidden()
            ->assertJsonPath('message', 'Product owner has read-only access');

        $period = $this->postJson('/api/v1/period', $payload, $this->auth($adminToken))
            ->assertOk()
            ->json('period');

        $this->postJson('/api/v1/period', [
            'name' => 'Legacy Audit Period '.uniqid(),
            'period_type' => 'audit',
            'join_code' => 'AUD'.strtoupper(substr(uniqid(), -6)),
            'is_join_code_active' => true,
        ], $this->auth($adminToken))
            ->assertOk()
            ->assertJsonPath('period.period_type', 'custom');

        $this->putJson('/api/v1/period/'.$period['id'], ['name' => 'Member Update Blocked'], $this->auth($memberToken))
            ->assertForbidden()
            ->assertJsonPath('message', 'Only admin can manage periods');

        $this->putJson('/api/v1/period/'.$period['id'], ['name' => 'Owner Update Blocked'], $this->auth($ownerToken))
            ->assertForbidden()
            ->assertJsonPath('message', 'Product owner has read-only access');

        $this->putJson('/api/v1/period/'.$period['id'], ['name' => 'Admin Update Allowed'], $this->auth($adminToken))
            ->assertOk()
            ->assertJsonPath('period.name', 'Admin Update Allowed');
    }

    public function test_product_owner_is_read_only_but_can_use_get_and_self_service_profile(): void
    {
        $adminToken = $this->tokenFor('po.admin@iso-tik.test', 'po_admin', 'admin');
        $ownerToken = $this->tokenFor('po.owner@iso-tik.test', 'po_owner', 'product_owner');

        $period = $this->postJson('/api/v1/period', [
            'name' => 'PO Read Period '.uniqid(),
            'period_type' => 'annual',
            'join_code' => 'PO'.strtoupper(substr(uniqid(), -6)),
            'is_join_code_active' => true,
        ], $this->auth($adminToken))->assertOk()->json('period');

        $this->getJson('/api/v1/admin/users?per_page=5', $this->auth($ownerToken))
            ->assertOk();

        $this->getJson('/api/v1/period?per_page=5', $this->auth($ownerToken))
            ->assertOk();

        $this->postJson('/api/v1/period/'.$period['id'].'/forums', [
            'name' => 'PO Blocked Forum '.uniqid(),
        ], $this->auth($ownerToken))
            ->assertForbidden()
            ->assertJsonPath('message', 'Product owner has read-only access');

        $this->postJson('/api/v1/forums/'.$period['id'].'/lock', [], $this->auth($ownerToken))
            ->assertForbidden()
            ->assertJsonPath('message', 'Product owner has read-only access');

        $this->putJson('/api/v1/profile', ['name' => 'Product Owner Updated'], $this->auth($ownerToken))
            ->assertOk()
            ->assertJsonPath('user.name', 'Product Owner Updated');
    }
}
