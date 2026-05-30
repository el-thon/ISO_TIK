# ISO TIK BE

Backend Laravel baru untuk rebuild sistem ISO TIK. Project ini berjalan mandiri menggunakan Podman, Podman Compose, dan PostgreSQL.

Frontend tidak diubah. Backend lama hanya digunakan sebagai referensi analisis, bukan sebagai source code utama.

## 1. Stack

| Komponen | Teknologi |
| --- | --- |
| Backend | Laravel |
| Runtime | PHP 8.4 CLI Alpine |
| Database | PostgreSQL 15 Alpine |
| Container | Podman |
| Compose file | `docker-compose.yml` |
| App container | `iso-tik-be-app` |
| DB container | `iso-tik-be-postgres` |
| API base local | `http://localhost:8080` |

## 2. Prasyarat

Pastikan sudah tersedia:

- Podman
- Podman Compose atau Docker Compose provider yang dapat dipakai oleh `podman compose`
- PowerShell atau terminal lain
- Koneksi internet untuk build image dan pull image PostgreSQL pertama kali

### Install Podman

Windows:

1. Install Podman Desktop dari:
   `https://podman-desktop.io/`
2. Pastikan Podman CLI tersedia di terminal:

```powershell
podman --version
```

3. Buat dan jalankan Podman machine jika belum ada:

```powershell
podman machine init
podman machine start
```

4. Cek status machine:

```powershell
podman machine list
```

Linux:

```bash
sudo apt update
sudo apt install -y podman
podman --version
```

### Install atau cek Podman Compose

Project ini menggunakan `docker-compose.yml`, tetapi dijalankan lewat Podman:

```powershell
podman compose version
```

Jika command di atas menggunakan external compose provider, itu tetap bisa dipakai selama `podman compose -f docker-compose.yml ...` berhasil.

## 3. Environment

Copy file environment:

```powershell
Copy-Item .env.example .env
```

Generate Laravel app key:

```powershell
podman run --rm -v ${PWD}:/app -w /app composer:2 php artisan key:generate --force
```

Konfigurasi penting:

```env
APP_NAME="ISO TIK BE"
APP_URL=http://localhost:8080

DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=iso_tik_be_db
DB_USERNAME=iso_tik_be_user
DB_PASSWORD=iso_tik_be_password

FRONTEND_URL=http://localhost:5173
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:8080
```

Catatan: `DB_HOST=postgres` dipakai karena nama service database di `docker-compose.yml` adalah `postgres`.

## 4. Build Image App

Jalankan dari folder project:

```powershell
cd E:\projects\tik_kp\iso-tik-be
podman build -f Containerfile -t iso-tik-be-app:local .
```

Image yang digunakan compose:

```text
localhost/iso-tik-be-app:local
```

Untuk cek image:

```powershell
podman images
```

## 5. Menjalankan Project

Jalankan app dan database:

```powershell
podman compose -f docker-compose.yml up -d --no-build
```

Jika ingin build ulang image lalu menjalankan:

```powershell
podman build -f Containerfile -t iso-tik-be-app:local .
podman compose -f docker-compose.yml up -d --no-build
```

Cek container:

```powershell
podman ps
```

Container yang harus aktif:

- `iso-tik-be-app`
- `iso-tik-be-postgres`

## 6. Cek Log

Log Laravel app:

```powershell
podman logs iso-tik-be-app --tail 100
```

Log PostgreSQL:

```powershell
podman logs iso-tik-be-postgres --tail 100
```

Jika startup app masih menjalankan `composer install`, tunggu sampai muncul:

```text
INFO  Server running on [http://0.0.0.0:8080].
```

## 7. Test Database

Cek PostgreSQL siap menerima koneksi:

```powershell
podman exec iso-tik-be-postgres pg_isready -U iso_tik_be_user -d iso_tik_be_db
```

Output berhasil:

```text
/var/run/postgresql:5432 - accepting connections
```

Cek dari Laravel:

```powershell
podman exec iso-tik-be-app php artisan migrate:status
```

Jika koneksi database benar, command tidak akan gagal karena error koneksi PostgreSQL.

## 8. Health Check API

Endpoint health check:

```text
GET http://localhost:8080/api/health
```

Cek dari host:

```powershell
Invoke-RestMethod -Uri http://localhost:8080/api/health | ConvertTo-Json -Depth 5
```

Response berhasil:

```json
{
  "status": "ok",
  "database": "ok",
  "service": "ISO TIK BE"
}
```

Jika `database` bernilai `ok`, artinya Laravel sudah berhasil terkoneksi ke PostgreSQL.

## 9. Masuk ke Container

Masuk ke container app:

```powershell
podman exec -it iso-tik-be-app sh
```

Jalankan artisan dari container:

```powershell
podman exec iso-tik-be-app php artisan route:list
podman exec iso-tik-be-app php artisan config:clear
podman exec iso-tik-be-app php artisan cache:clear
```

Jalankan composer dari container:

```powershell
podman exec iso-tik-be-app composer install
```

## 10. Migration dan Seeder

Project ini memakai PostgreSQL schema namespace, bukan prefix table. Migration domain final membuat schema berikut:

- `auth`
- `collaboration`
- `content`
- `workflow`
- `security`
- `system`

File penting:

| File | Fungsi |
| --- | --- |
| `database/migrations/0001_01_01_000000_create_database_schema.php` | Laravel migration wrapper |
| `database/migrations/001_create_database_schema.sql` | SQL PostgreSQL schema final |
| `database/seeders/DatabaseSeeder.php` | Urutan seeder utama |

### 10.1 Cek Status Migration

```powershell
podman exec iso-tik-be-app php artisan migrate:status
```

Output berhasil menampilkan migration berikut sebagai `Ran`:

```text
0001_01_01_000000_create_database_schema
```

### 10.2 Jalankan Migration

Untuk menjalankan migration tanpa menghapus data:

```powershell
podman exec iso-tik-be-app php artisan migrate --force
```

### 10.3 Jalankan Seeder

Untuk menjalankan seeder tanpa reset database:

```powershell
podman exec iso-tik-be-app php artisan db:seed --force
```

Seeder bersifat idempotent, jadi aman dijalankan ulang. Seeder menggunakan `updateOrCreate` agar data master tidak duplikat.

### 10.4 Reset Database dan Seed Ulang

Untuk development, gunakan:

```powershell
podman exec iso-tik-be-app php artisan migrate:fresh --seed --force
```

Command ini akan:

1. Menghapus schema domain lama.
2. Membuat ulang schema PostgreSQL final.
3. Menjalankan semua migration.
4. Menjalankan semua seeder minimal.

Catatan penting: karena project menggunakan PostgreSQL schema namespace, migration wrapper membersihkan schema domain pada environment `local` dan `testing` agar `migrate:fresh` benar-benar bersih.

### 10.5 Seeder yang Dijalankan

Urutan seeder:

```text
1. Database\Seeders\Auth\RoleSeeder
2. Database\Seeders\Auth\AdminUserSeeder
3. Database\Seeders\Auth\DevelopmentUserSeeder
4. Database\Seeders\System\SystemSettingSeeder
5. Database\Seeders\System\ClauseSeeder
6. Database\Seeders\Content\TopicDocumentMasterSeeder
7. Database\Seeders\Collaboration\DevelopmentForumSeeder
8. Database\Seeders\Content\DevelopmentTopicSeeder
```

Data development yang dibuat:

| Data | Jumlah |
| --- | --- |
| Users | 5 |
| Roles | 3 |
| System settings | 1 |
| Clauses | 5 |
| Topic document masters | 1 |
| Forum periods | 1 |
| Forums | 1 |
| Topics | 1 |
| Input items | 1 |

### 10.6 Akun Development

Password default semua user seed:

```text
password
```

| Nama | Email | Role Global | Tujuan |
| --- | --- | --- | --- |
| ISO TIK Admin | `admin@iso-tik.test` | `admin` | Login admin dan modul administrasi |
| ISO TIK Product Owner | `product.owner@iso-tik.test` | `product_owner` | Validasi product owner/read-only |
| ISO TIK Member | `member@iso-tik.test` | `member` | User umum |
| Auditor Development | `auditor@iso-tik.test` | `member` | Participant forum role `auditor` |
| Auditee Development | `auditee@iso-tik.test` | `member` | Participant forum role `auditee` |

Password disimpan di database sebagai `password_hash`, bukan plain text.

### 10.7 Validasi Hasil Seeder

Hitung data utama:

```powershell
podman exec iso-tik-be-app php -r "require 'vendor/autoload.php'; `$app = require 'bootstrap/app.php'; `$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap(); echo 'users=' . App\Models\User::count() . PHP_EOL; echo 'roles=' . App\Models\Auth\Role::count() . PHP_EOL; echo 'settings=' . App\Models\System\Setting::count() . PHP_EOL; echo 'clauses=' . App\Models\System\Clause::count() . PHP_EOL; echo 'masters=' . App\Models\Content\TopicDocumentMaster::count() . PHP_EOL; echo 'periods=' . App\Models\Collaboration\ForumPeriod::count() . PHP_EOL; echo 'forums=' . App\Models\Collaboration\Forum::count() . PHP_EOL; echo 'topics=' . App\Models\Content\Topic::count() . PHP_EOL; echo 'input_items=' . App\Models\Content\InputItem::count() . PHP_EOL;"
```

Validasi relasi dasar:

```powershell
podman exec iso-tik-be-app php -r "require 'vendor/autoload.php'; `$app = require 'bootstrap/app.php'; `$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap(); `$user = App\Models\User::with('roles','profile','contact','employment')->where('email','admin@iso-tik.test')->firstOrFail(); echo 'user_relations=' . `$user->roles->pluck('name')->implode('|') . ',' . `$user->profile->full_name . PHP_EOL; `$forum = App\Models\Collaboration\Forum::with('period','participants.user')->firstOrFail(); echo 'forum_relations=' . `$forum->period->name . ',participants=' . `$forum->participants->count() . PHP_EOL; `$topic = App\Models\Content\Topic::with('forum','inputItems','versions','workflowStates')->firstOrFail(); echo 'topic_relations=' . `$topic->forum->name . ',items=' . `$topic->inputItems->count() . ',versions=' . `$topic->versions->count() . PHP_EOL;"
```

### 10.8 Validasi Test Setelah Seeder

```powershell
podman exec iso-tik-be-app php artisan test
```

### 10.9 Troubleshooting Migration dan Seeder

Jika migration gagal karena schema/table sudah ada:

```powershell
podman exec iso-tik-be-app php artisan migrate:fresh --seed --force
```

Jika ingin membersihkan semua data container database:

```powershell
podman compose -f docker-compose.yml down -v
podman compose -f docker-compose.yml up -d --no-build
podman exec iso-tik-be-app php artisan migrate:fresh --seed --force
```

Jika seeder gagal karena constraint enum role forum, pastikan migration sudah memuat role participant:

```text
owner, admin, participant, viewer, auditor, auditee
```

Jika seeder gagal karena kolom password, pastikan user seed dan factory memakai:

```text
password_hash
```

## 11. Storage Link untuk Upload File

Laravel menyimpan file upload pada disk `public` di folder:

```text
storage/app/public
```

Agar file tersebut bisa diakses dari browser melalui URL `/storage/...`, buat symbolic link Laravel:

```powershell
podman exec iso-tik-be-app php artisan storage:link
```

Command ini membuat link:

```text
public/storage -> storage/app/public
```

Jalankan command ini setelah container app aktif, terutama sebelum menguji fitur upload:

- foto profil
- tanda tangan pengguna
- attachment
- dokumen

Contoh alur lengkap setelah menjalankan container:

```powershell
podman compose -f docker-compose.yml up -d --no-build
podman exec iso-tik-be-app php artisan storage:link
podman exec iso-tik-be-app php artisan migrate:fresh --seed --force
```

Jika link sudah pernah dibuat dan muncul pesan bahwa link sudah ada, itu normal. Untuk membuat ulang link secara paksa:

```powershell
podman exec iso-tik-be-app php artisan storage:unlink
podman exec iso-tik-be-app php artisan storage:link
```

Validasi dari container:

```powershell
podman exec iso-tik-be-app ls -la public/storage
```

Jika upload file berhasil, path seperti berikut akan tersedia pada disk public:

```text
storage/app/public/profiles/photos/{user_id}/...
storage/app/public/profiles/signatures/{user_id}/...
```

Dan dapat diakses melalui:

```text
http://localhost:8080/storage/profiles/photos/{user_id}/...
http://localhost:8080/storage/profiles/signatures/{user_id}/...
```

Catatan: jika memakai Windows host dan Podman volume mount, pastikan container `iso-tik-be-app` sedang berjalan saat menjalankan `storage:link`.

## 12. Stop dan Rebuild

Matikan container:

```powershell
podman compose -f docker-compose.yml down
```

Matikan container dan hapus volume database:

```powershell
podman compose -f docker-compose.yml down -v
```

Rebuild image:

```powershell
podman build -f Containerfile -t iso-tik-be-app:local .
```

Jalankan ulang:

```powershell
podman compose -f docker-compose.yml up -d --no-build
```

## 13. Troubleshooting

Jika `podman compose` gagal karena machine belum aktif:

```powershell
podman machine start
podman machine list
```

Jika port 8080 atau 5432 sudah dipakai, matikan container lama atau ubah mapping port di `docker-compose.yml`.

Jika API health gagal koneksi database, cek:

```powershell
podman ps
podman logs iso-tik-be-app --tail 100
podman logs iso-tik-be-postgres --tail 100
podman exec iso-tik-be-app php artisan config:clear
```

Pastikan `.env` memakai:

```env
DB_HOST=postgres
DB_DATABASE=iso_tik_be_db
DB_USERNAME=iso_tik_be_user
DB_PASSWORD=iso_tik_be_password
```

Jika file upload tidak bisa diakses melalui `/storage/...`, jalankan ulang:

```powershell
podman exec iso-tik-be-app php artisan storage:link
podman exec iso-tik-be-app php artisan config:clear
```

Lalu cek apakah file memang tersimpan di `storage/app/public`.

## 14. File Penting

| File | Fungsi |
| --- | --- |
| `Containerfile` | Image PHP/Laravel untuk app |
| `docker-compose.yml` | Menjalankan app dan PostgreSQL dengan Podman Compose |
| `.env.example` | Template konfigurasi environment |
| `routes/api.php` | Route API, termasuk `/api/health` |

## 15. Status Saat Ini

Project siap dijalankan mandiri dengan:

```powershell
podman compose -f docker-compose.yml up -d --no-build
```

Validasi utama:

```powershell
Invoke-RestMethod -Uri http://localhost:8080/api/health | ConvertTo-Json -Depth 5
```

Status berhasil jika response berisi:

```json
{
  "status": "ok",
  "database": "ok",
  "service": "ISO TIK BE"
}
```
