import dotenv from 'dotenv';
dotenv.config({ path: '.env.development.local' });
import { Pool } from 'pg';

if (!process.env.POSTGRES_URL) {
  console.error('POSTGRES_URL tidak ditemukan di .env.development.local');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  const { rows: databaseRows } = await pool.query(
    'SELECT NOW() AS time, current_database() AS db'
  );
  console.log('✅ Koneksi berhasil:', databaseRows[0]);

  const { rows: tableRows } = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
  );
  const tables = new Set(tableRows.map(({ table_name }) => table_name));
  const requiredTables = [
    'mifus_hospitals',
    'mifus_users',
    'mifus_devices',
    'mifus_patients',
    'mifus_device_telemetry',
    'mifus_alarm_events',
  ];
  const missingTables = requiredTables.filter((table) => !tables.has(table));
  if (missingTables.length > 0) {
    throw new Error(`Skema MIFUS belum lengkap. Tabel yang hilang: ${missingTables.join(', ')}`);
  }

  const { rows: userColumns } = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'mifus_users'`
  );
  const columns = new Set(userColumns.map(({ column_name }) => column_name));
  const requiredUserColumns = ['name', 'email', 'password_hash', 'role', 'hospital_id'];
  const missingColumns = requiredUserColumns.filter((column) => !columns.has(column));
  if (missingColumns.length > 0) {
    throw new Error(`Skema mifus_users belum lengkap. Kolom yang hilang: ${missingColumns.join(', ')}`);
  }

  const { rows: userRows } = await pool.query('SELECT COUNT(*) FROM mifus_users');
  console.log('✅ Skema MIFUS valid; jumlah akun:', userRows[0].count);
} catch (err) {
  console.error('❌ Gagal:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}