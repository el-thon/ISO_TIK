# 🧹 Panduan Membersihkan Cache React Query

## Masalah yang Diperbaiki

Data lama masih muncul di interface meskipun backend sudah fresh migrate karena:

1. **keepPreviousData: true** - React Query mempertahankan data lama
2. **staleTime terlalu lama** - Cache dianggap fresh hingga 60 detik
3. **Fallback ke topic.input_items** - Mengambil data dari cache lama
4. **Browser cache** - React Query menyimpan cache di memory

## Perubahan yang Sudah Dilakukan

### 1. File: `src/pages/topics/detail.jsx`

- ✅ Hapus `keepPreviousData: true` dari semua query
- ✅ Tambahkan `refetchOnMount: true` untuk selalu fetch saat mount
- ✅ Tambahkan `refetchOnWindowFocus: true` pada topic utama
- ✅ Hapus fallback ke `topic?.input_items` (baris 764)

### 2. File: `src/services/topicHooks.js`

- ✅ Set `staleTime: 0` untuk input items, versions, reviews
- ✅ Set `cacheTime: 5 * 60 * 1000` (5 menit) untuk balance performance
- ✅ Hapus `keepPreviousData: true` dari semua topic detail queries

## Cara Membersihkan Cache di Browser

### Opsi 1: Hard Reload Browser (Paling Mudah)

```bash
# Windows/Linux
Ctrl + Shift + R

# Mac
Cmd + Shift + R
```

### Opsi 2: Clear Browser Storage

1. Buka DevTools (F12)
2. Tab **Application** (Chrome) atau **Storage** (Firefox)
3. Klik **Clear site data** atau hapus:
   - Local Storage
   - Session Storage
   - IndexedDB
4. Reload halaman

### Opsi 3: Clear React Query Cache via Console

Buka browser console (F12) dan jalankan:

```javascript
// Clear semua cache React Query
window.__REACT_QUERY_CLIENT__?.clear();

// Atau jika menggunakan React Query DevTools
window.__REACT_QUERY_DEVTOOLS_GLOBAL_HOOK__?.queryClient?.clear();

// Reload halaman setelahnya
window.location.reload();
```

### Opsi 4: Tambahkan Tombol Clear Cache (Development Only)

Tambahkan di komponen untuk development:

```jsx
{
  process.env.NODE_ENV === "development" && (
    <Button
      onClick={() => {
        queryClient.clear();
        window.location.reload();
      }}
      variant="destructive"
    >
      🧹 Clear Cache & Reload
    </Button>
  );
}
```

## Cara Testing Setelah Perubahan

### 1. Restart Dev Server

```bash
# Stop server (Ctrl+C)
npm run dev
```

### 2. Buka Browser Incognito/Private Mode

Ini memastikan tidak ada cache browser lama:

```bash
# Chrome
Ctrl + Shift + N

# Firefox
Ctrl + Shift + P
```

### 3. Verifikasi di Network Tab

1. Buka DevTools → Network
2. Centang "Disable cache"
3. Refresh halaman
4. Periksa request ke `/topics/:id/input-items`
5. Response harus mengembalikan array kosong jika backend kosong

### 4. Periksa React Query DevTools

Jika sudah install `@tanstack/react-query-devtools`:

```javascript
// Cek status query
import { useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();
console.log("All queries:", queryClient.getQueryCache().getAll());
console.log(
  "Topic queries:",
  queryClient.getQueryData(["topics", "detail", topicId]),
);
```

## Ekspektasi Setelah Fix

### ✅ Yang Harus Terjadi:

- Setiap kali buka halaman detail topic → fetch fresh dari backend
- Jika backend return kosong → UI tampilkan "Belum ada konten"
- Tidak ada data lama yang muncul
- Klik "Segarkan" → langsung fetch ulang

### ❌ Jika Masih Bermasalah:

1. Cek apakah ada service worker yang cache request
2. Periksa Nginx/proxy config (cache header)
3. Verifikasi backend benar-benar return data kosong
4. Cek apakah ada mock data di `topicService.js`

## Monitoring & Debug

### Tambahkan Log untuk Debug

Di `src/services/topicService.js` sudah ada debug utility:

```javascript
debug.log("Fetching input items for topic", { topicId, params });
debug.log("Raw input items from API", items);
```

Buka console untuk melihat log ini (hanya di development mode).

### Periksa Backend Response

```bash
# Curl request langsung ke backend
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/topics/:topicId/input-items

# Harus return:
{
  "data": {
    "items": []
  }
}
```

## Rekomendasi untuk Production

Untuk production, kembalikan `staleTime` yang wajar (tapi tetap hapus `keepPreviousData`):

```javascript
staleTime: 30_000, // 30 detik
cacheTime: 5 * 60 * 1000, // 5 menit
```

Ini balance antara fresh data dan performa network.

---

**Catatan**: Jika masih ada masalah setelah semua langkah ini, kemungkinan:

1. Backend belum benar-benar kosong (cek dengan tinker/SQL direct)
2. Ada data di tabel relationship (attachments, versions, dll)
3. Soft delete masih menyimpan data (cek `deleted_at` column)
