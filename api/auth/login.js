import bcrypt from 'bcryptjs';
import { query } from '../_lib/sheets.js';
import { signToken } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method tidak diizinkan' });

  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ error: 'Email dan password wajib diisi' });
  }

  try {
    const result = await query(
      'SELECT id, name, email, password_hash, role, hospital_id FROM mifus_users WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [email.trim()]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Email atau password salah' });

    const user = result.rows[0];
    if (!['manager', 'nurse'].includes(user.role)) {
      return res.status(403).json({ error: 'Akses portal pasien belum tersedia' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Email atau password salah' });

    const token = signToken(user);
    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        hospital_id: user.hospital_id,
      },
    });
  } catch (err) {
    console.error('Gagal memproses login MIFUS:', err);
    return res.status(err.status || 500).json({
      error: err.status ? err.message : 'Gagal memproses login',
    });
  }
}
