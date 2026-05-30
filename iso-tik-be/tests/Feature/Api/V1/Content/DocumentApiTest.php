<?php

namespace Tests\Feature\Api\V1\Content;

use App\Models\Content\Document;
use App\Models\Security\AuditLog;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class DocumentApiTest extends ContentTestCase
{
    public function test_document_list_download_info_and_download_work(): void
    {
        Storage::fake('public');
        $token = $this->tokenFor('document.admin@iso-tik.test', 'document_admin', 'admin');
        Storage::disk('public')->put('documents/test/document.pdf', 'document-body');
        $document = Document::create([
            'title' => 'Document Test',
            'description' => 'Created for test',
            'original_filename' => 'document.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => strlen('document-body'),
            'stored_path' => 'documents/test/document.pdf',
            'uploaded_by_user_id' => $this->user('document.admin@iso-tik.test', 'document_admin', 'admin')->id,
        ]);

        $this->getJson('/api/v1/documents?per_page=10', $this->auth($token))
            ->assertOk()
            ->assertJsonStructure(['data' => ['documents', 'items'], 'documents', 'items', 'meta', 'pagination'])
            ->assertJsonFragment(['id' => $document->id]);

        $this->getJson('/api/v1/documents/'.$document->id.'/download-info', $this->auth($token))
            ->assertOk()
            ->assertJsonStructure(['data' => ['document', 'download_url', 'filename', 'mime_type', 'size', 'exists'], 'document', 'download_url']);

        $this->get('/api/v1/documents/'.$document->id.'/download', $this->auth($token))
            ->assertOk()
            ->assertHeader('content-disposition');

        $this->assertTrue(AuditLog::where('entity_type', 'document')
            ->where('entity_id', $document->id)
            ->where('action', 'document_downloaded')
            ->exists());
    }

    public function test_admin_can_create_show_update_and_delete_document(): void
    {
        Storage::fake('public');
        $token = $this->tokenFor('document.crud@iso-tik.test', 'document_crud', 'admin');

        $document = $this->post('/api/v1/documents', [
            'file' => UploadedFile::fake()->create('production-document.pdf', 16, 'application/pdf'),
            'title' => 'Production Document',
            'document_number' => 'DOC-PROD-001',
            'revision_number' => '01',
        ], $this->auth($token))
            ->assertOk()
            ->assertJsonStructure(['data' => ['document'], 'document'])
            ->json('document');

        $this->assertFalse(str_starts_with((string) $document['stored_path'], 'E:'));
        $this->assertFalse(str_contains((string) $document['stored_path'], '\\'));
        $this->assertTrue(AuditLog::where('entity_type', 'document')->where('entity_id', $document['id'])->where('action', 'document_uploaded')->exists());

        $this->getJson('/api/v1/documents/'.$document['id'], $this->auth($token))
            ->assertOk()
            ->assertJsonPath('document.id', $document['id'])
            ->assertJsonStructure(['data' => ['document'], 'document']);

        $this->putJson('/api/v1/documents/'.$document['id'], [
            'title' => 'Updated Production Document',
            'revision_number' => '02',
        ], $this->auth($token))
            ->assertOk()
            ->assertJsonPath('document.title', 'Updated Production Document');

        $this->call('PUT', '/api/v1/documents/'.$document['id'], ['title' => 'Updated With File'], [], [
            'file' => UploadedFile::fake()->create('replacement.csv', 8, 'text/csv'),
        ], $this->transformHeadersToServerVars($this->auth($token)))
            ->assertOk()
            ->assertJsonPath('document.original_filename', 'replacement.csv');

        $this->assertTrue(AuditLog::where('entity_type', 'document')->where('entity_id', $document['id'])->where('action', 'document_updated')->exists());

        $this->deleteJson('/api/v1/documents/'.$document['id'], [], $this->auth($token))
            ->assertOk()
            ->assertJsonPath('message', 'Document deleted successfully');

        $this->assertSoftDeleted('content.documents', ['id' => $document['id']]);
        $this->assertTrue(AuditLog::where('entity_type', 'document')->where('entity_id', $document['id'])->where('action', 'document_deleted')->exists());
    }

    public function test_document_write_authorization_and_mime_rules(): void
    {
        Storage::fake('public');
        $adminToken = $this->tokenFor('document.auth.admin@iso-tik.test', 'document_auth_admin', 'admin');
        $ownerToken = $this->tokenFor('document.auth.owner@iso-tik.test', 'document_auth_owner', 'product_owner');
        $memberToken = $this->tokenFor('document.auth.member@iso-tik.test', 'document_auth_member', 'member');

        $document = $this->post('/api/v1/documents', [
            'file' => UploadedFile::fake()->create('allowed.pdf', 16, 'application/pdf'),
            'title' => 'Allowed Document',
        ], $this->auth($adminToken))->assertOk()->json('document');

        $this->getJson('/api/v1/documents', $this->auth($ownerToken))->assertOk();
        $this->getJson('/api/v1/documents', $this->auth($memberToken))->assertOk();

        $this->post('/api/v1/documents', [
            'file' => UploadedFile::fake()->create('blocked.pdf', 16, 'application/pdf'),
        ], $this->auth($ownerToken))
            ->assertForbidden()
            ->assertJsonPath('message', 'Product owner has read-only access');

        $this->post('/api/v1/documents', [
            'file' => UploadedFile::fake()->create('blocked.pdf', 16, 'application/pdf'),
        ], $this->auth($memberToken))
            ->assertForbidden()
            ->assertJsonPath('message', 'Only admin can manage documents');

        $this->putJson('/api/v1/documents/'.$document['id'], ['title' => 'Owner Blocked'], $this->auth($ownerToken))
            ->assertForbidden()
            ->assertJsonPath('message', 'Product owner has read-only access');

        $this->deleteJson('/api/v1/documents/'.$document['id'], [], $this->auth($memberToken))
            ->assertForbidden()
            ->assertJsonPath('message', 'Only admin can manage documents');

        foreach ([
            UploadedFile::fake()->create('image.jpg', 16, 'image/jpeg'),
            UploadedFile::fake()->create('archive.zip', 16, 'application/zip'),
            UploadedFile::fake()->create('script.js', 1, 'application/javascript'),
            UploadedFile::fake()->create('page.html', 1, 'text/html'),
        ] as $file) {
            $this->post('/api/v1/documents', ['file' => $file], $this->auth($adminToken))
                ->assertUnprocessable()
                ->assertJsonPath('success', false);
        }
    }

    public function test_document_download_returns_safe_404_for_seed_or_missing_file(): void
    {
        $token = $this->tokenFor('document.missing@iso-tik.test', 'document_missing', 'admin');
        $document = Document::create([
            'title' => 'Missing Document',
            'original_filename' => 'missing.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => 0,
            'stored_path' => 'seed://missing.pdf',
            'uploaded_by_user_id' => $this->user('document.missing@iso-tik.test', 'document_missing', 'admin')->id,
        ]);

        $this->getJson('/api/v1/documents/'.$document->id.'/download', $this->auth($token))
            ->assertNotFound()
            ->assertJson(['success' => false, 'message' => 'File not found']);
    }

    public function test_document_endpoint_requires_token(): void
    {
        $this->getJson('/api/v1/documents')->assertUnauthorized();
    }
}
