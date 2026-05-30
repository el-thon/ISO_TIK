<?php

namespace Tests\Feature\Api\V1\Content;

class TopicVersionApiTest extends ContentTestCase
{
    public function test_versions_list_and_revert_work(): void
    {
        $token = $this->tokenFor('version.admin@iso-tik.test', 'version_admin', 'admin');
        $topic = $this->topic($token);
        $this->postJson('/api/v1/topics/'.$topic['id'].'/publish', [], $this->auth($token))->assertOk();
        $versions = $this->getJson('/api/v1/topics/'.$topic['id'].'/versions?per_page=10', $this->auth($token))->assertOk()->assertJsonStructure(['data' => ['versions', 'items'], 'versions', 'items', 'meta', 'pagination'])->json('versions');
        $this->assertNotEmpty($versions);
        $this->postJson('/api/v1/topics/'.$topic['id'].'/versions/'.$versions[0]['id'].'/revert', ['reason' => 'test revert'], $this->auth($token))->assertOk()->assertJsonStructure(['data' => ['topic', 'version'], 'topic', 'version']);
    }
}
