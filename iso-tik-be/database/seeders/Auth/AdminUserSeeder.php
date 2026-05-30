<?php

namespace Database\Seeders\Auth;

use App\Models\Auth\Role;
use App\Models\Auth\UserAddress;
use App\Models\Auth\UserContact;
use App\Models\Auth\UserEmployment;
use App\Models\Auth\UserProfile;
use App\Models\Auth\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public const DEFAULT_PASSWORD = 'password';

    public function run(): void
    {
        $password = $this->demoPassword();
        $adminRole = $this->adminRole();
        $assignedBy = null;

        foreach ($this->adminUsers($password) as $data) {
            $admin = $this->seedUser($data, $adminRole, $assignedBy);
            $assignedBy ??= $admin->id;
        }
    }

    private function seedUser(array $data, Role $role, ?string $assignedBy): User
    {
        $user = User::updateOrCreate(
            ['email' => $data['email']],
            [
                'name' => $data['name'],
                'username' => $data['username'],
                'password_hash' => Hash::make($data['password']),
                'status' => 'active',
                'failed_login_attempts' => 0,
                'deleted_at' => null,
            ],
        );

        UserProfile::updateOrCreate(
            ['user_id' => $user->id],
            ['full_name' => $data['name'], 'deleted_at' => null],
        );

        UserContact::updateOrCreate(
            ['user_id' => $user->id],
            [
                'email_institutional' => $data['email'],
                'email_personal' => $data['email'],
                'deleted_at' => null,
            ],
        );

        UserAddress::updateOrCreate(
            ['user_id' => $user->id],
            [
                'city' => 'Bandar Lampung',
                'province' => 'Lampung',
                'country' => 'Indonesia',
                'deleted_at' => null,
            ],
        );

        UserEmployment::updateOrCreate(
            ['user_id' => $user->id],
            [
                'employee_id' => $data['employee_id'],
                'unit' => 'UPA TIK',
                'department' => 'Teknologi Informasi',
                'functional_position' => $data['position'],
                'employment_status' => 'active',
                'deleted_at' => null,
            ],
        );

        UserRole::updateOrCreate(
            ['user_id' => $user->id, 'role_id' => $role->id],
            [
                'assigned_by' => $assignedBy ?? $user->id,
                'assigned_at' => now(),
                'revoked_at' => null,
                'deleted_at' => null,
            ],
        );

        return $user;
    }

    private function adminRole(): Role
    {
        return Role::updateOrCreate(
            ['name' => 'admin'],
            [
                'guard_name' => 'web',
                'display_name' => 'Administrator',
                'description' => 'Role administrator untuk akses penuh modul administrasi.',
                'is_system' => true,
                'deleted_at' => null,
            ],
        );
    }

    private function adminUsers(string $password): array
    {
        return [
            [
                'name' => 'ISO TIK Admin 1',
                'email' => 'admin@example.com',
                'username' => 'admin',
                'employee_id' => 'ADM-001',
                'position' => 'Administrator Sistem',
                'password' => $password,
            ],
            [
                'name' => 'ISO TIK Admin 2',
                'email' => 'admin2@example.com',
                'username' => 'admin2',
                'employee_id' => 'ADM-002',
                'position' => 'Administrator Sistem',
                'password' => $password,
            ],
            [
                'name' => 'ISO TIK Admin 3',
                'email' => 'admin3@example.com',
                'username' => 'admin3',
                'employee_id' => 'ADM-003',
                'position' => 'Administrator Sistem',
                'password' => $password,
            ],
        ];
    }

    private function demoPassword(): string
    {
        if (config('app.env') === 'production') {
            return (string) $this->envValue('DEMO_USER_PASSWORD', self::DEFAULT_PASSWORD);
        }

        return self::DEFAULT_PASSWORD;
    }

    private function envValue(string $key, mixed $default = null): mixed
    {
        $value = getenv($key);

        return $value === false ? env($key, $default) : $value;
    }
}
