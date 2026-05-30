<?php

namespace Tests\Feature\Api\V1\Collaboration;

class ForumApiTest extends CollaborationTestCase
{
    public function test_forum_lifecycle_join_and_states_work(): void
    {
        $adminToken = $this->tokenFor('forum.admin@iso-tik.test', 'forum_admin', 'admin');
        $memberToken = $this->tokenFor('forum.member@iso-tik.test', 'forum_member', 'member');

        $period = $this->postJson('/api/v1/period', [
            'name' => 'Forum Period '.uniqid(),
            'join_code' => 'PER'.strtoupper(substr(uniqid(), -6)),
        ], $this->auth($adminToken))->assertOk()->json('period');

        $forum = $this->postJson('/api/v1/period/'.$period['id'].'/forums', [
            'name' => 'Forum Lifecycle '.uniqid(),
            'visibility' => 'private',
            'join_code' => 'JOIN'.strtoupper(substr(uniqid(), -6)),
        ], $this->auth($adminToken))->assertOk()->json('forum');

        $this->getJson('/api/v1/forums?per_page=10', $this->auth($memberToken))
            ->assertOk()
            ->assertJsonStructure(['data' => ['forums', 'rooms', 'items'], 'forums', 'rooms', 'items', 'meta', 'pagination']);

        $this->postJson('/api/v1/forums/join', ['join_code' => $forum['join_code']], $this->auth($memberToken))
            ->assertOk()
            ->assertJsonStructure(['data' => ['forum', 'room', 'participant'], 'forum', 'room', 'participant']);

        $this->getJson('/api/v1/forums/'.$forum['id'], $this->auth($memberToken))
            ->assertOk()
            ->assertJsonPath('forum.current_user_role', 'auditee');

        $this->putJson('/api/v1/forums/'.$forum['id'], ['description' => 'Updated forum'], $this->auth($adminToken))
            ->assertOk()
            ->assertJsonPath('forum.description', 'Updated forum');

        $this->postJson('/api/v1/forums/'.$forum['id'].'/lock', [], $this->auth($adminToken))->assertOk()->assertJsonPath('forum.is_locked', true);
        $this->postJson('/api/v1/forums/'.$forum['id'].'/unlock', [], $this->auth($adminToken))->assertOk()->assertJsonPath('forum.is_locked', false);
        $this->postJson('/api/v1/forums/'.$forum['id'].'/archive', [], $this->auth($adminToken))->assertOk()->assertJsonPath('forum.is_archived', true);
        $this->postJson('/api/v1/forums/'.$forum['id'].'/restore', [], $this->auth($adminToken))->assertOk()->assertJsonPath('forum.is_archived', false);
        $this->deleteJson('/api/v1/forums/'.$forum['id'], [], $this->auth($adminToken))->assertOk()->assertJsonPath('success', true);
    }
}
