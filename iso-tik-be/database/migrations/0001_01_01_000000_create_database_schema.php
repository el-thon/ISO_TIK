<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (app()->environment(['local', 'testing'])) {
            $this->dropDomainSchemas();
        }

        $sql = file_get_contents(database_path('migrations/001_create_database_schema.sql'));
        $sql = preg_replace('/^\s*BEGIN;\s*$/mi', '', $sql);
        $sql = preg_replace('/^\s*COMMIT;\s*$/mi', '', $sql);

        DB::unprepared($sql);
    }

    public function down(): void
    {
        $this->dropDomainSchemas();
    }

    private function dropDomainSchemas(): void
    {
        DB::unprepared(<<<'SQL'
            DROP SCHEMA IF EXISTS security CASCADE;
            DROP SCHEMA IF EXISTS workflow CASCADE;
            DROP SCHEMA IF EXISTS content CASCADE;
            DROP SCHEMA IF EXISTS collaboration CASCADE;
            DROP SCHEMA IF EXISTS system CASCADE;
            DROP SCHEMA IF EXISTS auth CASCADE;
        SQL);
    }
};
