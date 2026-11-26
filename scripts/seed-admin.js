import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development.local' });

const {
  POSTGRES_URL,
  ADMIN_NAME,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  HOSPITAL_NAME,
  HOSPITAL_ADDRESS,
} = process.env;

const required = {
  POSTGRES_URL,
  ADMIN_NAME,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  HOSPITAL_NAME,
  HOSPITAL_ADDRESS,
};
const missing = Object.entries(required)
  .filter(([, value]) => !value?.trim())
  .map(([name]) => name);

if (missing.length > 0) {
  console.error(`Konfigurasi wajib belum diisi: ${missing.join(', ')}`);
  process.exit(1);
}

if (ADMIN_PASSWORD.length < 12) {
  console.error('ADMIN_PASSWORD harus memiliki minimal 12 karakter.');
  process.exit(1);
}

const isLocalDb = /localhost|127\.0\.0\.1/.test(POSTGRES_URL);
const pool = new Pool({
  connectionString: POSTGRES_URL,
  ssl: isLocalDb ? false : { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existingUser = await client.query(
      'SELECT 1 FROM mifus_users WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [ADMIN_EMAIL.trim()]
    );
    if (existingUser.rowCount > 0) {
      throw new Error('Email admin sudah terdaftar.');
    }

    const hospital = await client.query(
      'INSERT INTO mifus_hospitals (name, address) VALUES ($1, $2) RETURNING id',
      [HOSPITAL_NAME.trim(), HOSPITAL_ADDRESS.trim()]
    );
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    await client.query(
      `INSERT INTO mifus_users (name, email, password_hash, role, hospital_id)
       VALUES ($1, $2, $3, 'manager', $4)`,
      [ADMIN_NAME.trim(), ADMIN_EMAIL.trim().toLowerCase(), passwordHash, hospital.rows[0].id]
    );

    await client.query('COMMIT');
    console.log(`Akun manager dan rumah sakit berhasil dibuat (ID rumah sakit: ${hospital.rows[0].id}).`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

try {
  await main();
} catch (error) {
  console.error('Gagal membuat akun awal Mifus:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
