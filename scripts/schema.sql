-- 1. Tabel Rumah Sakit
CREATE TABLE hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Pengguna (Manager, Perawat, Pasien)
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

-- 3. Tabel Perangkat IoT Mifus
CREATE TABLE devices (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'MF001', 'MF002'
    hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
    room_number VARCHAR(50),
    bed_number VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Pasien
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    medical_record_number VARCHAR(50) UNIQUE NOT NULL,
    diagnosis TEXT,
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
    device_id VARCHAR(50) UNIQUE REFERENCES devices(id) ON DELETE SET NULL,
    total_volume_prescribed INT DEFAULT 500, -- mL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel Telemetri Terbaru (Hanya menyimpan data state terakhir agar efisien)
CREATE TABLE device_telemetry (
    device_id VARCHAR(50) PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
    current_volume INT NOT NULL,     -- mL sisa
    flow_rate DOUBLE PRECISION NOT NULL, -- mL/s
    percentage INT NOT NULL,         -- 0 - 100%
    battery_level INT DEFAULT 100,
    status VARCHAR(20) DEFAULT 'normal', -- 'normal', 'warning', 'critical'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabel Log Kejadian Alarm / Kendala Infus
CREATE TABLE alarm_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(50) REFERENCES devices(id) ON DELETE CASCADE,
    alarm_type VARCHAR(50) NOT NULL, -- 'OCCLUSION', 'EMPTY_BAG', 'LOW_BATTERY'
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT false,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);