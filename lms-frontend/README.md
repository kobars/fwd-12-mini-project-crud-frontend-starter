# FWD 12 LMS

Frontend React + Vite. Backend Express + MySQL disediakan terpisah dan tidak disertakan dalam repository ini.

## Menjalankan

Jalankan setup dan server backend terpisah pada http://127.0.0.1:3000 terlebih dahulu. Pada terminal lain, dari folder `lms-frontend`:

```bash
npm install
npm run dev
```

Buka http://127.0.0.1:5173/lms/.

Proxy Vite mengirim `/api` ke http://127.0.0.1:3000. Header pemilih kasus otomatis bernilai `lms`. Tidak perlu mengubah konfigurasi CORS.

## Build

```bash
npm run build
```

Hasilnya berada di `dist`. Jika backend dijalankan dengan `npm start`, frontend juga tersedia pada http://127.0.0.1:3000/lms/. Untuk mode tersebut, letakkan backend terpisah sejajar dengan kedua folder frontend.

## Mencoba aplikasi

Gunakan `Akun latihan` untuk memilih pengguna contoh. Tambah, edit, dan hapus data sesuai peran serta kepemilikan. Perubahan disimpan di MySQL. Buka kategori untuk mencoba CRUD kategori. Aktifkan `Fitur bonus` untuk menggunakan search, filter, sorting, dan klasifikasi rating dari API.

Satu-satunya acuan requirement adalah dokumen FWD 12 CRUD API (Update & Delete). Identitas latihan bukan autentikasi dan tidak menggunakan JWT. Penjelasan setup database, endpoint, dan keputusan implementasi tersedia pada dokumentasi backend terpisah.

## Pengujian

Jalankan `npm test` untuk memeriksa penanganan respons API, pembatalan request, dan pesan validasi. Pada mode development, React Strict Mode dapat membatalkan request awal dan mengirim request pengganti; request yang dibatalkan tidak boleh menampilkan error pada halaman.
