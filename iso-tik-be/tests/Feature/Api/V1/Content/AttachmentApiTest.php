<?php

namespace Tests\Feature\Api\V1\Content;

use App\Models\Content\Attachment;
use App\Models\Security\AuditLog;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class AttachmentApiTest extends ContentTestCase
{
    public function test_forum_attachment_list_upload_download_info_and_download_work(): void
    {
        Storage::fake('public');
        $token = $this->tokenFor('attachment.admin@iso-tik.test', 'attachment_admin', 'admin');
        $forum = $this->forum($token);

        $this->getJson('/api/v1/forums/'.$forum['id'].'/attachments?per_page=10', $this->auth($token))
            ->assertOk()
            ->assertJsonStructure(['data' => ['attachments', 'files', 'items'], 'attachments', 'files', 'items', 'meta', 'pagination']);

        $uploaded = $this->post('/api/v1/forums/'.$forum['id'].'/attachments', [
            'file' => UploadedFile::fake()->create('evidence.pdf', 16, 'application/pdf'),
            'description' => 'Evidence test',
        ], $this->auth($token))
            ->assertOk()
            ->assertJsonStructure(['data' => ['attachment', 'file'], 'attachment', 'file'])
            ->json('attachment');

        $this->assertDatabaseHas('content.attachments', [
            'id' => $uploaded['id'],
            'forum_id' => $forum['id'],
            'filename' => 'evidence.pdf',
        ]);

        $this->getJson('/api/v1/attachments/'.$uploaded['id'].'/download-info', $this->auth($token))
            ->assertOk()
            ->assertJsonStructure(['data' => ['attachment', 'download_url', 'filename', 'mime_type', 'size', 'exists'], 'attachment', 'download_url']);

        $this->get('/api/v1/attachments/'.$uploaded['id'].'/download', $this->auth($token))
            ->assertOk()
            ->assertHeader('content-disposition');

        $this->assertTrue(AuditLog::where('entity_type', 'attachment')
            ->where('entity_id', $uploaded['id'])
            ->where('action', 'attachment_downloaded')
            ->exists());
    }

    public function test_forum_attachment_mime_rules_reject_images_archives_and_scripts(): void
    {
        Storage::fake('public');
        $token = $this->tokenFor('attachment.mime@iso-tik.test', 'attachment_mime', 'admin');
        $forum = $this->forum($token);

        $this->post('/api/v1/forums/'.$forum['id'].'/attachments', [
            'file' => UploadedFile::fake()->create('evidence.pdf', 16, 'application/pdf'),
        ], $this->auth($token))->assertOk();

        $this->post('/api/v1/forums/'.$forum['id'].'/attachments', [
            'file' => UploadedFile::fake()->create('sheet.csv', 16, 'text/csv'),
        ], $this->auth($token))->assertOk();

        foreach ([
            UploadedFile::fake()->create('image.png', 16, 'image/png'),
            UploadedFile::fake()->create('archive.zip', 16, 'application/zip'),
            UploadedFile::fake()->create('script.php', 1, 'text/plain'),
            UploadedFile::fake()->create('page.html', 1, 'text/html'),
        ] as $file) {
            $this->post('/api/v1/forums/'.$forum['id'].'/attachments', ['file' => $file], $this->auth($token))
                ->assertUnprocessable()
                ->assertJsonPath('success', false);
        }

        $this->post('/api/v1/forums/'.$forum['id'].'/attachments', [], $this->auth($token))
            ->assertUnprocessable()
            ->assertJsonPath('success', false);
    }

    public function test_attachment_download_returns_safe_404_for_seed_or_missing_file(): void
    {
        $token = $this->tokenFor('attachment.missing@iso-tik.test', 'attachment_missing', 'admin');
        $forum = $this->forum($token);
        $attachment = Attachment::create([
            'forum_id' => $forum['id'],
            'storage_url' => 'seed://missing.pdf',
            'filename' => 'missing.pdf',
            'content_type' => 'application/pdf',
            'size_bytes' => 0,
            'created_by_user_id' => $this->user('attachment.missing@iso-tik.test', 'attachment_missing', 'admin')->id,
        ]);

        $this->getJson('/api/v1/attachments/'.$attachment->id.'/download', $this->auth($token))
            ->assertNotFound()
            ->assertJson(['success' => false, 'message' => 'File not found']);
    }

    public function test_attachment_endpoint_requires_token(): void
    {
        $this->getJson('/api/v1/forums/not-real/attachments')->assertUnauthorized();
    }
}
