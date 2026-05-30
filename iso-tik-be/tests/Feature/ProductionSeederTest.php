<?php

namespace Tests\Feature;

use App\Models\Auth\Role;
use App\Models\Content\TopicDocumentMaster;
use App\Models\System\Setting;
use App\Models\User;
use Database\Seeders\Auth\ProductionUserSeeder;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use InvalidArgumentException;
use Tests\TestCase;

class ProductionSeederTest extends TestCase
{
    private array $envKeys = [
        'SEED_DEMO_DATA',
        'SEED_PRODUCTION_ADMIN',
        'SEED_PRODUCTION_PRODUCT_OWNER',
        'PRODUCTION_ADMIN_NAME',
        'PRODUCTION_ADMIN_EMAIL',
        'PRODUCTION_ADMIN_PASSWORD',
        'PRODUCTION_PRODUCT_OWNER_NAME',
        'PRODUCTION_PRODUCT_OWNER_EMAIL',
        'PRODUCTION_PRODUCT_OWNER_PASSWORD',
        'DEMO_USER_PASSWORD',
    ];

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'database.default' => 'pgsql',
            'database.connections.pgsql.host' => env('TEST_DB_HOST', 'postgres'),
            'database.connections.pgsql.port' => env('TEST_DB_PORT', '5432'),
            'database.connections.pgsql.database' => env('TEST_DB_DATABASE', 'iso_tik_be_db'),
            'database.connections.pgsql.username' => env('TEST_DB_USERNAME', 'iso_tik_be_user'),
            'database.connections.pgsql.password' => env('TEST_DB_PASSWORD', 'iso_tik_be_password'),
        ]);

        DB::purge('pgsql');
        DB::connection('pgsql')->getPdo();
        DB::beginTransaction();

        foreach ($this->envKeys as $key) {
            putenv($key);
            unset($_ENV[$key], $_SERVER[$key]);
        }
    }

    protected function tearDown(): void
    {
        DB::rollBack();

        foreach ($this->envKeys as $key) {
            putenv($key);
            unset($_ENV[$key], $_SERVER[$key]);
        }

        config(['app.env' => 'testing']);

        parent::tearDown();
    }

    public function test_required_production_seed_data_can_be_seeded_without_demo_data(): void
    {
        config(['app.env' => 'production']);
        $this->setEnv('SEED_DEMO_DATA', 'false');
        $this->setEnv('SEED_PRODUCTION_ADMIN', 'false');
        $this->setEnv('SEED_PRODUCTION_PRODUCT_OWNER', 'false');

        $this->seed(DatabaseSeeder::class);

        $roles = Role::query()->pluck('name')->sort()->values()->all();

        $this->assertSame(['admin', 'member', 'product_owner'], $roles);
        $this->assertFalse(Role::whereIn('name', ['auditor', 'auditee'])->exists());
        $this->assertTrue(Setting::where('key', 'security.login_otp.enabled')->exists());
        $this->assertGreaterThanOrEqual(1, TopicDocumentMaster::where('is_active', true)->count());
    }

    public function test_production_admin_and_product_owner_are_seeded_from_env_with_strong_passwords(): void
    {
        config(['app.env' => 'production']);
        $this->setEnv('SEED_PRODUCTION_ADMIN', 'true');
        $this->setEnv('PRODUCTION_ADMIN_NAME', 'Production Admin');
        $this->setEnv('PRODUCTION_ADMIN_EMAIL', 'production.admin.seed@example.com');
        $this->setEnv('PRODUCTION_ADMIN_PASSWORD', 'StrongProductionPassword123!');
        $this->setEnv('SEED_PRODUCTION_PRODUCT_OWNER', 'true');
        $this->setEnv('PRODUCTION_PRODUCT_OWNER_NAME', 'Production Product Owner');
        $this->setEnv('PRODUCTION_PRODUCT_OWNER_EMAIL', 'production.po.seed@example.com');
        $this->setEnv('PRODUCTION_PRODUCT_OWNER_PASSWORD', 'AnotherStrongPassword123!');

        $this->seed(\Database\Seeders\Auth\RoleSeeder::class);
        $this->seed(ProductionUserSeeder::class);

        $admin = User::where('email', 'production.admin.seed@example.com')->firstOrFail();
        $productOwner = User::where('email', 'production.po.seed@example.com')->firstOrFail();

        $this->assertTrue($admin->hasRole('admin'));
        $this->assertTrue($productOwner->hasRole('product_owner'));
        $this->assertSame('active', $admin->status);
        $this->assertFalse(Hash::check('password', $admin->password_hash));
        $this->assertTrue(Hash::check('StrongProductionPassword123!', $admin->password_hash));
    }

    public function test_production_user_seeder_rejects_weak_passwords(): void
    {
        config(['app.env' => 'production']);
        $this->setEnv('SEED_PRODUCTION_ADMIN', 'true');
        $this->setEnv('PRODUCTION_ADMIN_EMAIL', 'production.weak.seed@example.com');
        $this->setEnv('PRODUCTION_ADMIN_PASSWORD', 'password');

        $this->seed(\Database\Seeders\Auth\RoleSeeder::class);

        $this->expectException(InvalidArgumentException::class);

        $this->seed(ProductionUserSeeder::class);
    }

    public function test_local_demo_seed_keeps_development_password_compatibility(): void
    {
        config(['app.env' => 'testing']);
        $this->setEnv('SEED_DEMO_DATA', 'true');
        $this->setEnv('SEED_PRODUCTION_ADMIN', 'false');
        $this->setEnv('SEED_PRODUCTION_PRODUCT_OWNER', 'false');

        $this->seed(DatabaseSeeder::class);

        $admin = User::where('email', 'admin@iso-tik.test')->firstOrFail();

        $this->assertTrue($admin->hasRole('admin'));
        $this->assertTrue(Hash::check('password', $admin->password_hash));
    }

    private function setEnv(string $key, string $value): void
    {
        putenv($key.'='.$value);
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
    }
}
