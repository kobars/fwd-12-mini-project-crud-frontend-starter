Cara menjalankan

Gunakan Node.js 22.12+ atau 24+. Jalankan backend di http://127.0.0.1:3000.
Pilih frontend sesuai tugasmu.

Marketplace
cd marketplace-frontend
npm install
npm run dev
Buka http://127.0.0.1:5174/marketplace/.

LMS
cd lms-frontend
npm install
npm run dev
Buka http://127.0.0.1:5173/lms/.

Cara menggunakan

Buat kategori terlebih dahulu, lalu tambah, lihat, edit, atau hapus produk/kursus.
Aktifkan Fitur bonus untuk mencoba pencarian, filter, dan pengurutan.

Endpoint wajib Marketplace

GET /api/products
GET /api/products/{id}
POST /api/products
PUT /api/products/{id}
DELETE /api/products/{id}

Endpoint wajib LMS

GET /api/courses
GET /api/courses/{id}
POST /api/courses
PUT /api/courses/{id}
DELETE /api/courses/{id}

Endpoint kategori untuk masing-masing pilihan

GET /api/categories
GET /api/categories/{id}
POST /api/categories
PUT /api/categories/{id}
DELETE /api/categories/{id}

Endpoint bonus Marketplace

GET /api/products?search=ui%20kit
GET /api/products?category_id=1
GET /api/products?min_price=10000&max_price=50000
GET /api/products?sort_by=rating&order=desc
GET /api/products?sort_by=price&order=asc
GET /api/products?sort_by=download_count&order=desc

Endpoint bonus LMS

GET /api/courses?search=laravel
GET /api/courses?category_id=1
GET /api/courses?level=beginner
GET /api/courses?sort_by=rating&order=desc
GET /api/courses?sort_by=enrolled_count&order=desc
GET /api/courses?sort_by=duration&order=asc
