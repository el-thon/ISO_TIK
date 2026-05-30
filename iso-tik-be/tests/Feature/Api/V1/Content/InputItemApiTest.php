<?php

namespace Tests\Feature\Api\V1\Content;

class InputItemApiTest extends ContentTestCase
{
    public function test_input_item_list_create_and_update_work(): void
    {
        $token = $this->tokenFor('input.admin@iso-tik.test', 'input_admin', 'admin');
        $topic = $this->topic($token);

        $this->getJson('/api/v1/topics/'.$topic['id'].'/input-items?per_page=10', $this->auth($token))->assertOk()->assertJsonStructure(['data' => ['input_items', 'items'], 'input_items', 'items', 'meta', 'pagination']);
        $item = $this->postJson('/api/v1/topics/'.$topic['id'].'/input-items', ['type' => 'finding', 'label' => 'Temuan Baru', 'value' => 'Deskripsi baru'], $this->auth($token))->assertOk()->assertJsonStructure(['data' => ['input_item', 'item'], 'input_item', 'item'])->json('item');
        $this->putJson('/api/v1/input-items/'.$item['id'], ['value' => 'Deskripsi diperbarui'], $this->auth($token))->assertOk()->assertJsonPath('item.value', 'Deskripsi diperbarui');
    }
}
