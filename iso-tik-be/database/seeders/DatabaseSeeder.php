<?php

namespace Database\Seeders;

use Database\Seeders\Auth\AdminUserSeeder;
use Database\Seeders\System\SystemClausesSeeder;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            SystemClausesSeeder::class,
            AdminUserSeeder::class,
        ]);
    }
}
