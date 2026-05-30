<?php

namespace Tests\Feature\Api\V1\Collaboration;

class ForumParticipantApiTest extends CollaborationTestCase
{
    public function test_participant_add_update_remove_and_leave_work(): void
    {
        $adminToken = $this->tokenFor('participant.admin@iso-tik.test', 'participant_admin', 'admin');
        $auditor = $this->user('auditor.participant@iso-tik.test', 'auditor_participant', 'member');
        $auditee = $this->user('auditee.participant@iso-tik.test', 'auditee_participant', 'member');

        $period = $this->postJson('/api/v1/period', ['name' => 'Participant Period '.uniqid()], $this->auth($adminToken))->assertOk()->json('period');
        $forum = $this->postJson('/api/v1/period/'.$period['id'].'/forums', ['name' => 'Participant Forum '.uniqid()], $this->auth($adminToken))->assertOk()->json('forum');

        $created = $this->postJson('/api/v1/forums/'.$forum['id'].'/participants', [
            'participants' => [
                ['user_id' => $auditor->id, 'role' => 'auditor'],
                ['user_id' => $auditee->id, 'role' => 'auditee'],
            ],
        ], $this->auth($adminToken))
            ->assertOk()
            ->assertJsonStructure(['data' => ['participants', 'users', 'items'], 'participants', 'users', 'items']);

        $participantId = $created->json('participants.0.id');

        $this->getJson('/api/v1/forums/'.$forum['id'].'/participants?per_page=10', $this->auth($adminToken))
            ->assertOk()
            ->assertJsonStructure(['data' => ['participants', 'users', 'items'], 'participants', 'users', 'items', 'meta', 'pagination']);

        $this->putJson('/api/v1/forums/'.$forum['id'].'/participants/'.$participantId, ['role' => 'auditee'], $this->auth($adminToken))
            ->assertOk()
            ->assertJsonPath('participant.role', 'auditee');

        $this->deleteJson('/api/v1/forums/'.$forum['id'].'/participants/'.$participantId, [], $this->auth($adminToken))
            ->assertOk()
            ->assertJsonPath('success', true);

        $auditeeToken = $this->tokenFor('auditee.participant@iso-tik.test', 'auditee_participant', 'member');
        $this->postJson('/api/v1/forums/'.$forum['id'].'/leave', [], $this->auth($auditeeToken))
            ->assertOk()
            ->assertJsonPath('success', true);
    }
}
