<?php

namespace Tests\Feature\Api\V1\Profile;

use App\Models\Auth\Role;
use App\Models\Auth\UserRole;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProfileApiTest extends TestCase
{
    private string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->usePostgres();
        $this->token = $this->loginToken($this->ensureUser('profile.api@iso-tik.test', 'profile_api'));
    }

    public function test_profile_show_and_update_work(): void
    {
        $this->getJson('/api/v1/profile', $this->authHeaders())
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['user', 'profile', 'contact', 'address', 'employment'], 'profile']);

        $this->putJson('/api/v1/profile', [
            'name' => 'Profile API User Updated',
            'full_name' => 'Profile API User Full Name',
            'phone' => '08123456789',
            'city' => 'Bandar Lampung',
        ], $this->authHeaders())
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('profile.full_name', 'Profile API User Full Name')
            ->assertJsonPath('contact.phone_number', '08123456789');
    }

    public function test_employment_and_change_password_work(): void
    {
        $this->putJson('/api/v1/profile/employment', [
            'employee_id' => 'EMP-PROFILE-API',
            'unit' => 'UPA TIK',
            'employment_status' => 'active',
        ], $this->authHeaders())
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('employment.employee_id', 'EMP-PROFILE-API');

        $this->postJson('/api/v1/profile/change-password', [
            'current_password' => 'wrong',
            'new_password' => 'password123',
            'new_password_confirmation' => 'password123',
        ], $this->authHeaders())->assertStatus(422);

        $this->postJson('/api/v1/profile/change-password', [
            'current_password' => 'password',
            'new_password' => 'password123',
            'new_password_confirmation' => 'password123',
        ], $this->authHeaders())
            ->assertOk()
            ->assertJsonPath('message', 'Password changed successfully');

        User::where('email', 'profile.api@iso-tik.test')->update([
            'password_hash' => Hash::make('password'),
        ]);
    }

    public function test_profile_photo_upload_and_delete_work(): void
    {
        Storage::fake('public');

        $this->post('/api/v1/profile/photo', [
            'photo' => $this->fakePng('avatar.png'),
        ], $this->authHeaders())
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['photo_url', 'user']);

        $this->deleteJson('/api/v1/profile/photo', [], $this->authHeaders())
            ->assertOk()
            ->assertJsonPath('photo_url', null);
    }

    private function authHeaders(): array
    {
        return ['Authorization' => 'Bearer '.$this->token, 'Accept' => 'application/json'];
    }

    private function fakePng(string $name): UploadedFile
    {
        return UploadedFile::fake()->createWithContent(
            $name,
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=')
        );
    }

    private function loginToken(User $user): string
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'login' => $user->email,
            'password' => 'password',
        ]);

        $response->assertOk();

        return $response->json('access_token');
    }

    private function ensureUser(string $email, string $username): User
    {
        $role = Role::firstOrCreate(['name' => 'member'], ['guard_name' => 'web', 'display_name' => 'Member', 'is_system' => true]);
        $user = User::updateOrCreate(
            ['email' => $email],
            ['name' => 'Profile API User', 'username' => $username, 'password_hash' => Hash::make('password'), 'status' => 'active']
        );
        UserRole::updateOrCreate(['user_id' => $user->id, 'role_id' => $role->id], ['assigned_by' => $user->id, 'assigned_at' => now()]);

        return $user;
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
}
