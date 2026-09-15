# FWD 12 CRUD Frontends

Dua aplikasi React + Vite untuk latihan CRUD API:

| Aplikasi | Folder | URL lokal |
| --- | --- | --- |
| LMS | `lms-frontend` | http://127.0.0.1:5173/lms/ |
| Marketplace | `marketplace-frontend` | http://127.0.0.1:5174/marketplace/ |

## Persiapan

Gunakan Node.js 22.12 atau lebih baru. Backend Express + MySQL harus disiapkan dan dijalankan secara terpisah pada http://127.0.0.1:3000. Repository ini hanya berisi frontend.

Kedua aplikasi mengambil data melalui API dan menyimpan perubahan melalui backend. Data katalog tidak memiliki fallback statis. Proxy Vite meneruskan `/api` ke port 3000; header `X-Case-Study` memilih dataset `lms` atau `marketplace`.

## Menjalankan

Terminal pertama:

```bash
cd lms-frontend
npm ci
npm run dev
```

Terminal kedua:

```bash
cd marketplace-frontend
npm ci
npm run dev
```

Pilih **Akun latihan** dengan peran instructor atau seller untuk mencoba tambah, edit, dan hapus data sesuai kepemilikan. Akun latihan merupakan identitas contoh, bukan login atau autentikasi.

## Build

Jalankan `npm run build` dari masing-masing folder frontend. Hasil build berada di folder `dist` masing-masing. `npm run preview` menyajikan hasil build dengan proxy API yang sama dan tetap memerlukan backend aktif.

Dokumentasi aplikasi: [LMS](lms-frontend/README.md) dan [Marketplace](marketplace-frontend/README.md).
