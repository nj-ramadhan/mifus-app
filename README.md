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
2. Salin `.env.example` menjadi `.env.local`, lalu isi `POSTGRES_URL`,
   `JWT_SECRET`, dan `IOT_INGEST_TOKEN` dengan nilai rahasia yang kuat
   (contoh generator: `openssl rand -base64 32`).
3. Jalankan SQL pada `scripts/schema.sql` di database PostgreSQL.
4. Untuk bootstrap pertama, isi `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
   (minimal 12 karakter), `HOSPITAL_NAME`, dan `HOSPITAL_ADDRESS`, lalu jalankan
   `node scripts/seed-admin.js`. Script ini membuat satu rumah sakit dan akun
   manager dalam satu transaksi.
5. Jalankan `npx vercel dev` untuk menguji frontend dan API Vercel bersama-sama.
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

Saat membuat *query* atau migrasi, selalu patuhi skema tabel berikut:

```sql
-- 1. Rumah Sakit
CREATE TABLE hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Pengguna (Manager, Nurse, Patient)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('manager', 'nurse', 'patient')) DEFAULT 'nurse',
    hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX users_email_case_insensitive_unique ON users (LOWER(email));

-- 3. Perangkat IoT Mifus
CREATE TABLE devices (
    id VARCHAR(50) PRIMARY KEY, -- Contoh ID hardware: 'MF001', 'MF002'
    hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
    room_number VARCHAR(50),
    bed_number VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Pasien
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    medical_record_number VARCHAR(50) UNIQUE NOT NULL,
    diagnosis TEXT,
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
    device_id VARCHAR(50) UNIQUE REFERENCES devices(id) ON DELETE SET NULL,
    total_volume_prescribed INT DEFAULT 500, -- dalam mL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Telemetri Realtime Terakhir (State Cache)
CREATE TABLE device_telemetry (
    device_id VARCHAR(50) PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
    current_volume INT NOT NULL,         -- sisa mL
    flow_rate DOUBLE PRECISION NOT NULL, -- mL/s
    percentage INT NOT NULL,             -- 0 - 100%
    battery_level INT DEFAULT 100,
    status VARCHAR(20) DEFAULT 'normal', -- 'normal' | 'warning' | 'critical'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Riwayat Kejadian Alarm (Event Logs)
CREATE TABLE alarm_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(50) REFERENCES devices(id) ON DELETE CASCADE,
    alarm_type VARCHAR(50) NOT NULL,     -- 'OCCLUSION' | 'EMPTY_BAG' | 'LOW_BATTERY'
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT false,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

Saat mengenerate kode komponen atau halaman baru:
Clinical Clarity & Contrast: Utamakan keterbacaan tinggi. Jangan gunakan neumorphism buram. Gunakan border tipis (border-slate-200) dan background putih bersih (bg-white).
Alert Severity Colors:
Critical: Rose (bg-rose-50, text-rose-700, border-rose-400, animate-pulse)
Warning: Amber (bg-amber-50, text-amber-700, border-amber-300)
Normal: Emerald / Blue (text-emerald-600 / text-blue-600)