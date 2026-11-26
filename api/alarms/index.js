import { query } from '../_lib/sheets.js';
import { verifyToken, requireRole, assertHospitalScope } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (!['GET', 'PUT'].includes(req.method)) {
    return res.status(405).json({ error: 'Method tidak diizinkan' });
  }

  try {
    const user = verifyToken(req);

    if (req.method === 'GET') {
      let scope = 'WHERE a.is_resolved = false';
      if (!['manager', 'nurse'].includes(user.role)) {
        return res.status(403).json({ error: 'Role tidak memiliki akses ke alarm MIFUS' });
      }
      if (!user.hospital_id) return res.status(403).json({ error: 'Akun belum terhubung ke rumah sakit' });
      scope += ' AND d.hospital_id = $1';
      const result = await query(`
        SELECT a.*, d.room_number, d.bed_number, p.name AS patient_name
        FROM mifus_alarm_events a
        LEFT JOIN mifus_devices d ON d.id = a.device_id
        LEFT JOIN mifus_patients p ON p.device_id = a.device_id
        ${scope}
        ORDER BY a.triggered_at DESC
        LIMIT 50
      `, [user.hospital_id]);
      return res.status(200).json(result.rows);
    }

    requireRole(user, ['manager', 'nurse']);
    const alarmId = req.body?.id || req.query?.id;
    if (!alarmId) return res.status(400).json({ error: 'id alarm wajib diisi' });
    if (typeof alarmId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(alarmId)) {
      return res.status(400).json({ error: 'id alarm tidak valid' });
    }

    const alarm = await query(`
      SELECT a.id, d.hospital_id
      FROM mifus_alarm_events a
      JOIN mifus_devices d ON d.id = a.device_id
      WHERE a.id = $1
    `, [alarmId]);
    if (alarm.rows.length === 0) return res.status(404).json({ error: 'Alarm tidak ditemukan' });

    assertHospitalScope(user, alarm.rows[0].hospital_id);
    const updated = await query(`
      UPDATE mifus_alarm_events
      SET is_resolved = true, resolved_at = NOW()
      WHERE id = $1 AND is_resolved = false
      RETURNING *
    `, [alarmId]);

    if (updated.rows.length === 0) return res.status(409).json({ error: 'Alarm sudah diselesaikan' });
    return res.status(200).json(updated.rows[0]);
  } catch (err) {
    return res.status(err.status || 500).json({
      error: err.status ? err.message : 'Gagal memproses alarm',
    });
  }
}
