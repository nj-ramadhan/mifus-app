-- MIFUS tables are namespaced to coexist with the SIMDES tables in the same database.
CREATE TABLE IF NOT EXISTS mifus_hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mifus_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('manager', 'nurse', 'patient')) DEFAULT 'nurse',
    hospital_id UUID REFERENCES mifus_hospitals(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS mifus_users_email_case_insensitive_unique
    ON mifus_users (LOWER(email));

CREATE TABLE IF NOT EXISTS mifus_devices (
    id VARCHAR(50) PRIMARY KEY,
    hospital_id UUID REFERENCES mifus_hospitals(id) ON DELETE SET NULL,
    room_number VARCHAR(50),
    bed_number VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mifus_patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    medical_record_number VARCHAR(50) UNIQUE NOT NULL,
    diagnosis TEXT,
    hospital_id UUID REFERENCES mifus_hospitals(id) ON DELETE CASCADE,
    device_id VARCHAR(50) UNIQUE REFERENCES mifus_devices(id) ON DELETE SET NULL,
    total_volume_prescribed INT DEFAULT 500,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mifus_device_telemetry (
    device_id VARCHAR(50) PRIMARY KEY REFERENCES mifus_devices(id) ON DELETE CASCADE,
    current_volume INT NOT NULL,
    flow_rate DOUBLE PRECISION NOT NULL,
    percentage INT NOT NULL,
    battery_level INT DEFAULT 100,
    status VARCHAR(20) DEFAULT 'normal',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mifus_alarm_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(50) REFERENCES mifus_devices(id) ON DELETE CASCADE,
    alarm_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT false,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);
