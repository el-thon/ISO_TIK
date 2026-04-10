# ISO-TIK Frontend v2

Frontend aplikasi **Sistem Formulir Ketidaksesuaian ISO-TIK** berbasis React + Vite.

## Ringkasan Sistem

Sistem ini mengelola hierarki data berikut:

1. **Ruangan** (periode/ruang kerja utama)
2. **Forum** (bagian diskusi/kerja di dalam ruangan)
3. **Formulir Ketidaksesuaian** (entri formulir di dalam forum)

Struktur akses bersifat bertingkat: akses ke forum dan formulir mengikuti keanggotaan user pada ruangan/forum.

## Role Global

Sistem memiliki 3 role global:

- **member**
- **admin**
- **product_owner**

### Matriks Hak Akses Utama

| Fitur / Aksi | member | admin | product_owner |
| --- | --- | --- | --- |
| Lihat daftar ruangan | ✅ | ✅ | ✅ |
| Buat ruangan | ✅ | ✅ | ❌ |
| Ubah ruangan (jika owner/creator) | ✅ | ✅ | ❌ |
| Lihat detail ruangan (list forum) | Terbatas sesuai keanggotaan | Terbatas sesuai keanggotaan | ✅ |
| Lihat detail forum (list formulir ketidaksesuaian) | Hanya forum yang menjadi bagiannya | Hanya forum yang menjadi bagiannya | ✅ |
| Dashboard ringkasan | ✅ | ✅ | ✅ |
| CRUD Dokumen Header formulir | ❌ | ✅ | Read-only di UI |
| CRUD Pengguna (role lain) | ❌ | ✅ | ❌ |
| CRUD Klausul | ❌ | ✅ | ❌ |

> Catatan: rule final tetap ditentukan backend authorization. README ini mendokumentasikan alur sistem yang saat ini digunakan pada frontend.

## Alur Akses yang Diimplementasikan

1. **User non-member ruangan**
   - Bisa melihat daftar seluruh ruangan (tanpa akses penuh ke rincian tertentu).
   - Bisa bergabung ke ruangan menggunakan **join code** dari owner ruangan.

2. **User member ruangan**
   - Tidak otomatis bisa membaca semua forum.
   - Hanya bisa mengakses forum yang memang menjadi bagiannya.

3. **Join forum (invite)**
   - User harus diundang oleh owner/pengelola forum agar menjadi bagian forum.

4. **Dashboard lintas role**
   - Dapat diakses semua role (member/admin/product_owner).
   - Menampilkan statistik agregat, termasuk total forum pada ruangan dan total formulir ketidaksesuaian pada forum.

## Modul Utama Frontend

- **Autentikasi**: login, refresh session, profile.
- **Ruangan**: list, create, detail, update, join by code.
- **Forum**: list forum yang relevan dengan user, detail forum, peserta forum.
- **Formulir Ketidaksesuaian**: list, detail, pembuatan, assignment, attachment, workflow.
- **Dashboard**: statistik pengguna, ruangan/forum, formulir.
- **Administrasi**:
  - Klausul (`/admin/system/clauses`)
  - Dokumen Header (`/admin/topic-document-masters`)
  - Manajemen Pengguna (`/admin/users`)

## Rute Halaman Utama

- `/beranda` → Dashboard
- `/ruangan` → Manajemen Ruangan
- `/forum` → Daftar Forum
- `/forum/:id` → Detail Forum
- `/formulir/:id` → Detail Formulir
- `/formulir/buat` → Buat Formulir
- `/administrasi` → Modul Administrasi
- `/profil` → Profil Pengguna

## Teknologi

- React 19
- Vite
- React Router
- TanStack React Query
- Tailwind CSS
- Radix UI
- Axios

## Persiapan Development

### Prasyarat

- Node.js 20+
- npm 10+

### Menjalankan Lokal

```bash
npm install --legacy-peer-deps
npm run dev
```

Akses: `http://localhost:5173`

### Environment

Buat file `.env` (opsional) dari `.env.example`.

Contoh variabel:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_FEATURE_RICH_TEXT=true
```

## Build & Deploy

### Build lokal

```bash
npm run build
npm run preview
```

### Docker (single service)

```bash
docker build -t iso-tik-fe .
docker run -d -p 5173:80 --name iso-tik-fe iso-tik-fe
```

### Docker Compose

```bash
docker-compose up --build -d
```

## Script NPM

- `npm run dev` — jalankan mode development
- `npm run build` — build produksi
- `npm run preview` — preview hasil build
- `npm run lint` — linting ESLint

## Struktur Folder Inti

- `src/pages` → halaman utama aplikasi
- `src/services` → API services + hooks React Query
- `src/routes` → route guard dan proteksi akses
- `src/components` → komponen UI dan komponen fitur
- `src/layout` → layout aplikasi
