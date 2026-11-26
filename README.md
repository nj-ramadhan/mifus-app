# 🩺 Mifus-App - Sistem Informasi Monitoring Infus

Repositori ini berisi aplikasi dashboard klinis **Mifus-App** untuk memantau sisa cairan infus, laju aliran, perangkat IoT, dan alarm pasien. Antarmuka menggunakan **React + Vite**, API menggunakan **Vercel Serverless Functions**, dan data disimpan di **PostgreSQL** (dapat di-host di Neon).

---

## 📌 1. Project Overview & Domain Context

- **Tujuan Utama:** Pemantauan real-time sisa cairan infus, laju tetesan (*flow rate*), serta deteksi dini kendala infus (kemacetan/oklusi dan labu kosong).
- **Peran Pengguna (RBAC):**
  1. `manager`: Mengelola perangkat IoT, data pasien, dan alokasi ruang/bed rumah sakit.
  2. `nurse`: Memantau pasien rawat inap, grafik tetesan infus, dan merespons alarm darurat.
  3. `patient`: Portal pasien belum tersedia; akun pasien tidak dapat masuk ke dashboard staf.

---

## 🛠️ 2. Tech Stack & Environment

- **Frontend:** React + Vite (JavaScript)
- **API:** Vercel Serverless Functions (`api/`)
- **Language:** JavaScript (ES6+)
- **Styling:** Tailwind CSS (Clean clinical palette: Slate, Blue, Emerald, Amber, Rose)
- **Database:** PostgreSQL via `pg`; [Neon](https://neon.tech) is a supported hosting option
- **IoT Protocol:** HTTP Webhook / MQTT Ingestion
- **Deployment:** Vercel (static frontend + Serverless Functions)

### Menjalankan secara lokal

1. Install dependency dengan `npm install`.
2. Salin `.env.example` menjadi `.env.development.local`, lalu isi `POSTGRES_URL`,
   `JWT_SECRET`, dan `IOT_INGEST_TOKEN` dengan nilai rahasia yang kuat
   (contoh generator: `openssl rand -base64 32`).
3. Jalankan SQL pada `scripts/schema.sql` di database PostgreSQL. Semua tabel
   MIFUS memakai awalan `mifus_`, sehingga aman berdampingan dengan tabel SIMDES
   dalam database yang sama. Jangan mengganti atau menghapus tabel `users` milik SIMDES.
4. Untuk bootstrap pertama, isi `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
   (minimal 12 karakter), `HOSPITAL_NAME`, dan `HOSPITAL_ADDRESS`, lalu jalankan
   `node scripts/seed-admin.js`. Script ini membuat satu rumah sakit dan akun
   manager dalam satu transaksi.
5. Jalankan `node test-db.mjs` untuk memeriksa koneksi dan skema MIFUS, lalu
   `npx vercel dev` untuk menguji frontend dan API Vercel bersama-sama.
   `npm run dev` hanya menjalankan frontend Vite.

Gunakan token `IOT_INGEST_TOKEN` yang sama pada perangkat IoT dan server, dan
jangan gunakan kredensial produksi untuk pengembangan lokal. Atur variabel yang
sama pada environment deployment Vercel. Variabel `ADMIN_*` dan
`HOSPITAL_*` hanya dipakai untuk bootstrap lokal, bukan runtime API.

### Integrasi perangkat IoT

Kirim `POST /api/iot/telemetry` dengan header `x-iot-token` yang berisi
`IOT_INGEST_TOKEN` dan payload JSON berikut. `deviceId`, `volume`,
`flowRate`, dan `percentage` wajib diisi; `batteryLevel` opsional.

```json
{
  "deviceId": "MF001",
  "volume": 420,
  "flowRate": 1.5,
  "percentage": 84,
  "batteryLevel": 92
}
```

`deviceId` harus sudah didaftarkan oleh manager. Data telemetri memperbarui
status terakhir perangkat dan membuka alarm saat nilai melewati ambang deteksi.

---

## 🗄️ 3. Database Schema Reference (PostgreSQL / Neon)

Jalankan `scripts/schema.sql` untuk membuat tabel MIFUS berikut:
`mifus_hospitals`, `mifus_users`, `mifus_devices`, `mifus_patients`,
`mifus_device_telemetry`, dan `mifus_alarm_events`. Migrasi bersifat aditif
(`CREATE TABLE IF NOT EXISTS`) dan tidak mengubah tabel SIMDES. Akun untuk login
MIFUS disimpan di `mifus_users`; akun SIMDES di `users` tetap terpisah.

Saat mengenerate kode komponen atau halaman baru:
Clinical Clarity & Contrast: Utamakan keterbacaan tinggi. Jangan gunakan neumorphism buram. Gunakan border tipis (border-slate-200) dan background putih bersih (bg-white).
Alert Severity Colors:
Critical: Rose (bg-rose-50, text-rose-700, border-rose-400, animate-pulse)
Warning: Amber (bg-amber-50, text-amber-700, border-amber-300)
Normal: Emerald / Blue (text-emerald-600 / text-blue-600)