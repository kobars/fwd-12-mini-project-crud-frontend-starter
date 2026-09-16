# Frontend CRUD

## Cara menjalankan

Gunakan Node.js 22.12+ dan jalankan backend di `http://127.0.0.1:3000`.
Pilih frontend sesuai tugasmu, lalu jalankan perintah berikut dari folder utama proyek.

### Marketplace

```bash
cd marketplace-frontend
npm install
npm run dev
```

Buka [Marketplace](http://127.0.0.1:5174/marketplace/).

### LMS

```bash
cd lms-frontend
npm install
npm run dev
```

Buka [LMS](http://127.0.0.1:5173/lms/).

## Cara menggunakan

1. Buat kategori terlebih dahulu.
2. Tambah, lihat, edit, atau hapus produk/kursus.
3. Aktifkan **Fitur bonus** untuk mencoba pencarian, filter, dan pengurutan.

## Endpoint wajib

### Marketplace

```text
GET    /api/products
GET    /api/products/{id}
POST   /api/products
PUT    /api/products/{id}
DELETE /api/products/{id}
```

### LMS

```text
GET    /api/courses
GET    /api/courses/{id}
POST   /api/courses
PUT    /api/courses/{id}
DELETE /api/courses/{id}
```

### Kategori — untuk masing-masing pilihan

```text
GET    /api/categories
GET    /api/categories/{id}
POST   /api/categories
PUT    /api/categories/{id}
DELETE /api/categories/{id}
```

## Endpoint bonus

### Marketplace

```text
GET /api/products?search=ui%20kit
GET /api/products?category_id=1
GET /api/products?min_price=10000&max_price=50000
GET /api/products?sort_by=rating&order=desc
GET /api/products?sort_by=price&order=asc
GET /api/products?sort_by=download_count&order=desc
```

### LMS

```text
GET /api/courses?search=laravel
GET /api/courses?category_id=1
GET /api/courses?level=beginner
GET /api/courses?sort_by=rating&order=desc
GET /api/courses?sort_by=enrolled_count&order=desc
GET /api/courses?sort_by=duration&order=asc
```
