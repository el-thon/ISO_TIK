# ISO-TIK Frontend (Vite + React)

Front-end untuk Sistem TIK Internal. Ditulis dengan React 19, Vite, React Query, dan Tailwind. Mendukung workflow topik (draft/review/approve), assignment, dan rich-text tinjauan.

## Arsitektur Singkat

- **React + Vite**: SPA dengan routing di `src/router.client.jsx` dan `src/routes.jsx`.
- **State/data**: TanStack React Query di `src/services/*Hooks.js` untuk fetch & caching.
- **UI**: Komponen di `src/components/ui` dan layout di `src/layout/MainLayout.jsx`.
- **Topik & Tinjauan**: Lihat `src/pages/topics/detail.jsx` dan `src/services/topicService.js`.

## Prasyarat

- Node.js 20+
- npm 10+

## Menjalankan Secara Lokal

```bash
npm install --legacy-peer-deps
npm run dev
# buka http://localhost:5173
```

## Build Produksi Lokal

```bash
npm run build
npm run preview
# buka http://localhost:4173
```

## Menjalankan dengan Docker

Pastikan Docker terpasang.

### Build & Run (single service)

```bash
docker build -t iso-tik-fe .
docker run -d -p 5173:80 --name iso-tik-fe iso-tik-fe
# buka http://localhost:5173
```

### Dengan docker-compose

```bash
docker-compose up --build -d
# buka http://localhost:5173
```

### Struktur Docker

- `Dockerfile`: multi-stage (deps → build → nginx static serve)
- `docker/nginx.conf`: SPA routing ke `index.html`
- `docker-compose.yml`: mapping port 5173→80

## Konfigurasi Lingkungan

- Vite env file: `.env` (opsional). Contoh variabel umum:
  - `VITE_API_BASE_URL=http://localhost:8000/api/v1`
  - `VITE_FEATURE_RICH_TEXT=true`

## Titik Masuk Kode Utama

- `src/main.jsx`: bootstrap aplikasi
- `src/App.jsx`: shell utama
- `src/routes.jsx`: definisi rute
- `src/services/api.js`: konfigurasi axios + token
- `src/services/topicService.js`: layanan topik & tinjauan
- `src/pages/topics/detail.jsx`: tampilan detail topik, workflow, versi, tinjauan (rich text)

## Skema Skrip npm

- `npm run dev` — dev server Vite
- `npm run build` — build produksi
- `npm run preview` — preview hasil build
- `npm run lint` — linting (eslint)

## Catatan Deployment

- Output build ada di `dist/`, disajikan oleh Nginx di image Docker.
- SPA routing sudah dikonfigurasi lewat `docker/nginx.conf` (fallback ke `index.html`).

## Troubleshooting

- **Port bentrok**: ganti mapping di `docker-compose.yml` (mis. `8080:80`).
- **CORS/API**: pastikan `VITE_API_BASE_URL` sesuai host backend.
- **Peer deps**: gunakan `npm install --legacy-peer-deps` bila ada konflik.# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
