import { query } from '../_lib/sheets.js';
import { verifyToken, AuthError } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method tidak diizinkan' });

  try {
    const user = verifyToken(req);
    if (!['manager', 'nurse'].includes(user.role)) {
      return res.status(403).json({ error: 'Role tidak memiliki akses ke dashboard MIFUS' });
    }
    if (!user.hospital_id) {
      return res.status(403).json({ error: 'Akun belum terhubung ke rumah sakit' });
    }

    const devicesResult = await query(`
      SELECT
        d.id AS device_id,
        d.hospital_id,
        d.room_number,
        d.bed_number,
        d.is_active,
        h.name AS hospital_name,
        p.id AS patient_id,
        p.name AS patient_name,
        p.medical_record_number,
        p.diagnosis,
        p.total_volume_prescribed,
        COALESCE(t.current_volume, 0) AS current_volume,
        COALESCE(t.flow_rate, 0) AS flow_rate,
        COALESCE(t.percentage, 0) AS percentage,
        COALESCE(t.battery_level, 100) AS battery_level,
        CASE WHEN d.is_active THEN COALESCE(t.status, 'offline') ELSE 'offline' END AS status,
        t.updated_at
      FROM devices d
      LEFT JOIN hospitals h ON h.id = d.hospital_id
      LEFT JOIN patients p ON p.device_id = d.id
      LEFT JOIN device_telemetry t ON t.device_id = d.id
      WHERE d.hospital_id = $1
      ORDER BY
        CASE
          WHEN d.is_active = false THEN 4
          WHEN t.status = 'critical' THEN 1
          WHEN t.status = 'warning' THEN 2
          ELSE 3
        END,
        d.id ASC
    `, [user.hospital_id]);

    const alarmsResult = await query(`
      SELECT
        a.id,
        a.device_id,
        a.alarm_type,
        a.message,
        a.is_resolved,
        a.triggered_at,
        a.resolved_at,
        d.room_number,
        d.bed_number,
        p.name AS patient_name
      FROM alarm_events a
      LEFT JOIN devices d ON d.id = a.device_id
      LEFT JOIN patients p ON p.device_id = a.device_id
      WHERE a.is_resolved = false AND d.hospital_id = $1
      ORDER BY a.triggered_at DESC
      LIMIT 20
    `, [user.hospital_id]);

    return res.status(200).json({
      devices: devicesResult.rows,
      activeAlarms: alarmsResult.rows,
    });
  } catch (err) {
    return res.status(err.status || (err instanceof AuthError ? 401 : 500)).json({
      error: err.status ? err.message : 'Gagal memuat data dashboard',
    });
  }
}
