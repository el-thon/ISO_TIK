<?php

namespace Tests\Feature\Api\V1\Content;

class TopicWorkflowApiTest extends ContentTestCase
{
    public function test_workflow_actions_work(): void
    {
        $token = $this->tokenFor('workflow.admin@iso-tik.test', 'workflow_admin', 'admin');
        $topic = $this->topic($token);

        $this->postJson('/api/v1/topics/'.$topic['id'].'/publish', ['comment' => 'ready'], $this->auth($token))
            ->assertOk()
            ->assertJsonPath('topic.status', 'in_review')
            ->assertJsonPath('topic.workflow_status', 'in_review')
            ->assertJsonPath('topic.status_alias', 'published')
            ->assertJsonPath('workflow.status', 'in_review');
        $this->postJson('/api/v1/topics/'.$topic['id'].'/approve', ['comment' => 'approved'], $this->auth($token))->assertOk()->assertJsonPath('topic.status', 'approved');
        $this->postJson('/api/v1/topics/'.$topic['id'].'/request-changes', ['reason' => 'revise'], $this->auth($token))->assertOk()->assertJsonPath('topic.status', 'changes_requested');
        $this->postJson('/api/v1/topics/'.$topic['id'].'/close', [], $this->auth($token))->assertOk()->assertJsonPath('topic.status', 'closed');
        $this->postJson('/api/v1/topics/'.$topic['id'].'/reopen', [], $this->auth($token))->assertOk()->assertJsonPath('topic.status', 'draft');
        $this->postJson('/api/v1/topics/'.$topic['id'].'/freeze', ['reason' => 'freeze'], $this->auth($token))
            ->assertOk()
            ->assertJsonPath('topic.status', 'draft')
            ->assertJsonPath('topic.is_frozen', true)
            ->assertJsonPath('topic.freeze_status', 'frozen')
            ->assertJsonPath('workflow.status', 'frozen');
        $this->postJson('/api/v1/topics/'.$topic['id'].'/unfreeze', [], $this->auth($token))
            ->assertOk()
            ->assertJsonPath('topic.status', 'draft')
            ->assertJsonPath('topic.is_frozen', false);
    }
}
