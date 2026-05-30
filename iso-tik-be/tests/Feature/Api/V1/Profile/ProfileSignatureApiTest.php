<?php

namespace Tests\Feature\Api\V1\Profile;

use App\Models\Content\UserSignature;
use App\Models\Security\AuditLog;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProfileSignatureApiTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->usePostgres();
    }

    public function test_signature_lifecycle_and_download_routes_are_safe(): void
    {
        Storage::fake('public');

        $login = $this->postJson('/api/v1/auth/login', [
            'login' => 'member@iso-tik.test',
            'password' => 'password',
        ]);
        $login->assertOk();
        $token = $login->json('access_token');
        $userId = $login->json('user.id');
        $headers = ['Authorization' => 'Bearer '.$token, 'Accept' => 'application/json'];

        UserSignature::where('user_id', $userId)->delete();

        $this->getJson('/api/v1/profile/signature', $headers)
            ->assertOk()
            ->assertJsonPath('message', 'Signature not found')
            ->assertJsonPath('signature', null);

        $this->post('/api/v1/profile/signature', [
            'file' => $this->fakePng('signature.png'),
        ], $headers)
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['signature']);

        $this->getJson('/api/v1/profile/signature', $headers)
            ->assertOk()
            ->assertJsonStructure(['signature']);

        $this->get('/api/v1/profile/signature/download', $headers)
            ->assertOk();

        $this->assertTrue(AuditLog::where('entity_type', 'signature')
            ->where('action', 'signature_downloaded')
            ->where('actor_user_id', $userId)
            ->exists());

        $this->get("/api/v1/users/{$userId}/signature/download", $headers)
            ->assertOk();

        $this->assertTrue(AuditLog::where('entity_type', 'user_signature')
            ->where('action', 'user_signature_downloaded')
            ->where('actor_user_id', $userId)
            ->exists());

        $this->deleteJson('/api/v1/profile/signature', [], $headers)
            ->assertOk()
            ->assertJsonPath('message', 'Signature deleted successfully');
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

    private function fakePng(string $name): UploadedFile
    {
        return UploadedFile::fake()->createWithContent(
            $name,
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=')
        );
    }
}
