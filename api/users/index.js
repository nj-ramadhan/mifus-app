import bcrypt from 'bcryptjs';
import { query } from '../_lib/sheets.js';
import { verifyToken, requireRole } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method tidak diizinkan' });
  }

  try {
    const user = verifyToken(req);
    requireRole(user, ['manager']);
    if (!user.hospital_id) {
      return res.status(403).json({ error: 'Akun belum terhubung ke rumah sakit' });
    }

    const { name, email, password } = req.body || {};
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
      return res.status(400).json({ error: 'Nama perawat wajib diisi (maksimal 100 karakter)' });
    }
    if (
      typeof email !== 'string' ||
      email.trim().length > 100 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(400).json({ error: 'Email perawat tidak valid' });
    }
    if (typeof password !== 'string' || password.length < 12) {
      return res.status(400).json({ error: 'Password harus memiliki minimal 12 karakter' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, hospital_id)
       VALUES ($1, $2, $3, 'nurse', $4)
       RETURNING id, name, email, role, hospital_id`,
      [name.trim(), email.trim().toLowerCase(), passwordHash, user.hospital_id]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email sudah terdaftar' });
    }
    return res.status(err.status || 500).json({
      error: err.status ? err.message : 'Gagal membuat akun perawat',
    });
  }
}
