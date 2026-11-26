import { query } from '../_lib/sheets.js';
import { verifyToken, requireRole } from '../_lib/auth.js';

function isNonEmptyString(value, maxLength) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength;
}

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

    const {
      name,
      medical_record_number,
      diagnosis,
      device_id,
      total_volume_prescribed,
    } = req.body || {};
    const volume = Number(total_volume_prescribed ?? 500);

    if (!isNonEmptyString(name, 100)) {
      return res.status(400).json({ error: 'Nama pasien wajib diisi (maksimal 100 karakter)' });
    }
    if (!isNonEmptyString(medical_record_number, 50)) {
      return res.status(400).json({ error: 'Nomor rekam medis wajib diisi (maksimal 50 karakter)' });
    }
    if (diagnosis != null && typeof diagnosis !== 'string') {
      return res.status(400).json({ error: 'Diagnosis tidak valid' });
    }
    if (!Number.isInteger(volume) || volume < 1 || volume > 2147483647) {
      return res.status(400).json({ error: 'Volume infus harus berupa bilangan bulat positif' });
    }
    if (device_id != null && (typeof device_id !== 'string' || !device_id.trim() || device_id.trim().length > 50)) {
      return res.status(400).json({ error: 'ID perangkat tidak valid' });
    }

    const selectedDevice = device_id?.trim() || null;
    if (selectedDevice) {
      const device = await query(
        'SELECT id FROM mifus_devices WHERE id = $1 AND hospital_id = $2 AND is_active = true',
        [selectedDevice, user.hospital_id]
      );
      if (device.rowCount === 0) {
        return res.status(404).json({ error: 'Perangkat aktif tidak ditemukan di rumah sakit Anda' });
      }
    }

    const result = await query(
      `INSERT INTO mifus_patients
        (name, medical_record_number, diagnosis, hospital_id, device_id, total_volume_prescribed)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, medical_record_number, diagnosis, hospital_id, device_id, total_volume_prescribed`,
      [
        name.trim(),
        medical_record_number.trim(),
        diagnosis?.trim() || null,
        user.hospital_id,
        selectedDevice,
        volume,
      ]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Nomor rekam medis atau perangkat sudah digunakan' });
    }
    return res.status(err.status || 500).json({
      error: err.status ? err.message : 'Gagal mendaftarkan pasien',
    });
  }
}
