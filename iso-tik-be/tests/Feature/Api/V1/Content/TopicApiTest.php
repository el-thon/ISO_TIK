<?php

namespace Tests\Feature\Api\V1\Content;

class TopicApiTest extends ContentTestCase
{
    public function test_topic_list_create_and_detail_work(): void
    {
        $token = $this->tokenFor('topic.admin@iso-tik.test', 'topic_admin', 'admin');
        $forum = $this->forum($token);

        $created = $this->postJson('/api/v1/forums/'.$forum['id'].'/topics', [
            'title' => 'Audit Topic '.uniqid(),
            'description' => 'Created from test',
            'input_items' => [['type' => 'finding', 'label' => 'Temuan', 'value' => 'Contoh temuan']],
        ], $this->auth($token))->assertOk()->assertJsonStructure(['data' => ['topic', 'input_items', 'workflow', 'participants'], 'topic'])->json('topic');

        $this->getJson('/api/v1/topics?per_page=10', $this->auth($token))
            ->assertOk()
            ->assertJsonStructure(['data' => ['topics', 'items'], 'topics', 'items', 'meta', 'pagination'])
            ->assertJsonStructure(['topics' => [['status', 'workflow_status', 'legacy_status', 'status_alias']]]);
        $this->getJson('/api/v1/forums/'.$forum['id'].'/topics?per_page=10', $this->auth($token))->assertOk()->assertJsonFragment(['id' => $created['id']]);
        $this->getJson('/api/v1/topics/'.$created['id'], $this->auth($token))
            ->assertOk()
            ->assertJsonStructure(['data' => ['topic', 'input_items', 'workflow', 'participants', 'versions'], 'topic', 'input_items', 'workflow', 'participants'])
            ->assertJsonStructure(['topic' => ['status', 'workflow_status', 'legacy_status', 'status_alias', 'is_frozen', 'freeze_status', 'can_publish', 'can_approve', 'can_request_changes', 'can_close', 'can_reopen', 'can_freeze', 'can_unfreeze']]);
    }
}
