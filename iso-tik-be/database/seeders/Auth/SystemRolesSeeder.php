<?php

namespace Database\Seeders\Auth;

use App\Models\Auth\Role;
use Illuminate\Database\Seeder;

class SystemRolesSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->roles() as $role) {
            Role::updateOrCreate(
                ['name' => $role['name']],
                [
                    'guard_name' => 'web',
                    'display_name' => $role['display_name'],
                    'description' => $role['description'],
                    'is_system' => true,
                    'deleted_at' => null,
                ],
            );
        }
    }

    private function roles(): array
    {
        return [
            [
                'name' => 'admin',
                'display_name' => 'Administrator',
                'description' => 'Role administrator untuk akses penuh modul administrasi.',
            ],
            [
                'name' => 'product_owner',
                'display_name' => 'Product Owner',
                'description' => 'Role product owner untuk akses baca lintas modul.',
            ],
            [
                'name' => 'member',
                'display_name' => 'Member',
                'description' => 'Role pengguna biasa untuk akses self-service dan kolaborasi.',
            ],
        ];
    }
}
