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

    const { id, room_number, bed_number } = req.body || {};
    if (typeof id !== 'string' || !id.trim() || id.trim().length > 50) {
      return res.status(400).json({ error: 'ID perangkat wajib diisi (maksimal 50 karakter)' });
    }
    if (room_number != null && (typeof room_number !== 'string' || room_number.trim().length > 50)) {
      return res.status(400).json({ error: 'Nomor ruangan maksimal 50 karakter' });
    }
    if (bed_number != null && (typeof bed_number !== 'string' || bed_number.trim().length > 50)) {
      return res.status(400).json({ error: 'Nomor bed maksimal 50 karakter' });
    }

    const result = await query(
      `INSERT INTO devices (id, hospital_id, room_number, bed_number)
       VALUES ($1, $2, $3, $4)
       RETURNING id, hospital_id, room_number, bed_number, is_active`,
      [id.trim(), user.hospital_id, room_number?.trim() || null, bed_number?.trim() || null]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'ID perangkat sudah digunakan' });
    }
    return res.status(err.status || 500).json({
      error: err.status ? err.message : 'Gagal mendaftarkan perangkat',
    });
  }
}
