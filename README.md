# LogiTrack - Platform E-Shipment Ekspedisi Darat Indonesia

LogiTrack adalah aplikasi web logistik terintegrasi (React + TypeScript, Tailwind CSS, Firebase Auth & Firestore) dengan alur **Send-Receive Automatic**, pelacakan peta real-time, penerbitan resi unik anti-balapan, konfirmasi penerimaan aman berbasis kode rahasia digital, dan Progressive Web App (PWA) siap instal di ponsel Android/iOS.

---

## 🌐 Alamat Hosting Online

Aplikasi telah dikonfigurasi untuk Firebase Hosting dengan rewrites SPA dan aturan keamanan Firestore granular:

- **URL Utama**: [https://aerial-ring-xsmzh.web.app](https://aerial-ring-xsmzh.web.app)
- **URL Alternatif**: [https://aerial-ring-xsmzh.firebaseapp.com](https://aerial-ring-xsmzh.firebaseapp.com)
- **Database Firestore**: `ai-studio-9a6209f9-4421-4182-8137-e2117b514a1e` (Named Database)

---

## 🚀 Fitur Unggulan

1. **Send-Receive Automatic**:
   - Pendaftaran pengiriman dengan kalkulasi ongkos kirim otomatis (berat aktual vs volumetrik ground transport `(L×W×H)/5000`).
   - Penomoran resi otomatis anti-klik ganda dan anti-balapan (`LGT-YYYYMMDD-NNNN`) berbasis transaksi Firestore atomik.
   - Kode konfirmasi 10-karakter alfanumerik berkekuatan kriptografis tinggi (32^10 kemungkinan).
2. **Keamanan Data & Privasi Terjamin (Zero PII Leakage)**:
   - Pelacakan publik (`/lacak/:resi` atau `publicTracking/{resi}`) hanya menampilkan kota asal, kota tujuan, estimasi waktu, status, posisi kurir, dan timeline ringkas tanpa membocorkan nomor telepon atau alamat lengkap jalan.
   - Kode konfirmasi disimpan terpisah dalam koleksi privat `shipmentSecrets` dan verifikasi penerima menggunakan kapabilitas `receiptKeys` tanpa mengekspos master code ke publik.
3. **PWA (Progressive Web App)**:
   - Web App Manifest valid dengan ikon 192x192, 512x512, dan maskable icon.
   - Offline caching via Service Worker Workbox (`dist/sw.js`).
   - Dapat dipasang (*Install App*) langsung dari browser Chrome / Android.
4. **Pemindai Barcode / QR Resi**:
   - Bekerja melalui kamera ponsel via HTTPS (`facingMode: 'environment'`).
   - Dilengkapi fallback input nomor resi manual jika kamera tidak diizinkan.
5. **Simulasi Pembayaran Terbuka**:
   - Opsi Virtual Account (BCA, Mandiri, BNI), QRIS Dinamis, dan Bayar di Tempat (COD) ditandai transparan sebagai mode simulasi demonstrasi.

---

## 👥 Akun Demo & Peran Pengguna

Untuk kemudahan pengujian, tersedia akun demo yang telah terdaftar dalam aturan keamanan Firestore:

| Peran (Role) | Email Demo | Password Demo | Akses & Wewenang |
| :--- | :--- | :--- | :--- |
| **Pengirim (Sender)** | `andi.pengirim@logitrack.id` | `password123` | Buat pesanan, bayar simulasi, lihat resi pribadi & kode konfirmasi |
| **Kurir (Courier)** | `budi.kurir@logitrack.id` | `password123` | Ambil paket dari pool antrean, perbarui status berurutan, bagikan koordinat GPS |
| **Admin Logistik** | `admin@logitrack.id` | `password123` | Pantau seluruh armada, tugaskan kurir, tandai kendala, ekspor CSV, seed demo data |

> **Catatan**: Tombol persona cepat pada modal login akan mengisi email di atas secara otomatis untuk kenyamanan login.

---

## 📦 Data Demo Pengujian

Aplikasi telah dilengkapi skrip seed dengan beberapa paket contoh lintas status:

1. **LGT-20261019-1001** (Jakarta &rarr; Bandung) &mdash; *Status: Paket Terdaftar (Belum Bayar)*
2. **LGT-20261019-2045** (Semarang &rarr; Surabaya) &mdash; *Status: Dalam Perjalanan (QRIS Lunas)* &bull; Kode: `KODE2045OK`
3. **LGT-20261019-3312** (Jakarta &rarr; Denpasar) &mdash; *Status: Terkirim (Selesai)* &bull; Kode: `KODE3312OK`
4. **LGT-20261019-4409** (Bekasi &rarr; Bandung) &mdash; *Status: Sedang Diantar (COD)* &bull; Kode: `KODE4409OK`

---

## 🛠️ Panduan Menjalankan Secara Lokal

### Prasyarat
- Node.js LTS (v20+) atau Bun (v1.2+)

### Instalasi Dependensi
```bash
npm install --legacy-peer-deps
# atau menggunakan Bun:
bun install
```

### Menjalankan Development Server
```bash
npm run dev
# Server aktif di http://localhost:3000
```

### Menjalankan Pengujian Audit Keamanan Aturan Firestore
```bash
npm run test:security
```

### Build Produksi & Validasi PWA
```bash
npm run lint
npm run build
```

---

## 🚢 Langkah Deploy Persis ke Firebase Hosting & Firestore Rules

Pastikan Firebase CLI telah terpasang di sistem Anda (`npm install -g firebase-tools`):

1. **Login ke Akun Google Firebase**:
   ```bash
   firebase login
   ```

2. **Deploy Firestore Rules**:
   Aturan keamanan Firestore LogiTrack menggunakan database bernama `ai-studio-9a6209f9-4421-4182-8137-e2117b514a1e`:
   ```bash
   firebase deploy --project aerial-ring-xsmzh --only firestore:rules
   ```

3. **Build Frontend**:
   ```bash
   npm run build
   ```

4. **Deploy ke Firebase Hosting**:
   ```bash
   firebase deploy --project aerial-ring-xsmzh --only hosting
   ```

5. **Deploy Sekaligus (Rules + Hosting)**:
   ```bash
   firebase deploy --project aerial-ring-xsmzh
   ```

---

## 📋 Matriks Keamanan Firestore Rules

| Koleksi | Akses Tamu / Publik | Pengirim (Sender) | Kurir (Courier) | Admin |
| :--- | :--- | :--- | :--- | :--- |
| `users` | Registrasi sender saja | Baca & edit profil sendiri (role terkunci) | Baca & edit profil sendiri | Akses penuh & manajemen role |
| `shipments` | Ditolak | Buat & baca paket sendiri; hanya boleh bayar simulasi | Baca & perbarui paket miliknya (urutan status) | Akses penuh & penugasan |
| `shipmentSecrets` | Ditolak | Baca kode paket miliknya | Ditolak | Baca seluruh kode |
| `receiptKeys` | `get` jika tahu `resi_kode` | Dibuat otomatis saat order | Ditolak | Akses penuh |
| `receiptConfirmations`| Buat bukti konfirmasi jika `resi_kode` valid | Ditolak | Ditolak | Akses penuh |
| `publicTracking` | `get` resi individual (list ditolak) | Update saat pembayaran | Update saat antar & GPS | Akses penuh |
| `pickupPool` | Ditolak | Dibuat saat order lunas/COD | Baca & klaim paket | Akses penuh |
| `counters` | Ditolak | Transaksi increment atomik (+1) | Transaksi increment | Akses penuh |
| `tariffs` | Baca tarif publik | Baca | Baca | Kelola matriks tarif |
