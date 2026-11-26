import { timingSafeEqual } from 'node:crypto';
import { query } from '../../_lib/sheets.js';

class InputError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

function numberOrThrow(value, name, { integer = false } = {}) {
  if (
    value === '' ||
    value === null ||
    value === undefined ||
    (typeof value === 'string' && !value.trim()) ||
    !Number.isFinite(Number(value)) ||
    (integer && !Number.isInteger(Number(value)))
  ) {
    throw new InputError(`${name} wajib berupa angka`);
  }
  return Number(value);
}

function validIngestToken(req) {
  const expected = process.env.IOT_INGEST_TOKEN;
  if (!expected) return null;

  const authorization = req.headers.authorization || '';
  const supplied = req.headers['x-iot-token'] ||
    (authorization.startsWith('Bearer ') ? authorization.slice(7) : '');
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length &&
    timingSafeEqual(expectedBuffer, suppliedBuffer);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method tidak diizinkan' });

  try {
    const tokenValid = validIngestToken(req);
    if (tokenValid === null) {
      return res.status(500).json({ error: 'IOT_INGEST_TOKEN belum dikonfigurasi di environment server' });
    }
    if (!tokenValid) return res.status(401).json({ error: 'Token perangkat IoT tidak valid' });

    const body = req.body || {};
    const deviceId = body.deviceId || body.device_id;
    if (typeof deviceId !== 'string' || !deviceId.trim() || deviceId.trim().length > 50) {
      return res.status(400).json({ error: 'deviceId wajib diisi (maksimal 50 karakter)' });
    }

    const volume = numberOrThrow(body.volume ?? body.current_volume, 'volume', { integer: true });
    const flowRate = numberOrThrow(body.flowRate ?? body.flow_rate, 'flowRate');
    const percentage = numberOrThrow(body.percentage, 'percentage', { integer: true });
    const batteryLevel = body.batteryLevel ?? body.battery_level;
    const battery = batteryLevel === undefined ? 100 : numberOrThrow(batteryLevel, 'batteryLevel', { integer: true });

    if (
      volume < 0 ||
      volume > 2147483647 ||
      flowRate < 0 ||
      percentage < 0 ||
      percentage > 100 ||
      battery < 0 ||
      battery > 100
    ) {
      return res.status(400).json({ error: 'Nilai telemetri berada di luar rentang yang valid' });
    }

    const device = await query('SELECT id, is_active FROM mifus_devices WHERE id = $1', [deviceId.trim()]);
    if (device.rows.length === 0) return res.status(404).json({ error: 'Perangkat IoT tidak ditemukan' });
    if (device.rows[0].is_active === false) return res.status(409).json({ error: 'Perangkat IoT tidak aktif' });

    let status = 'normal';
    let alarmType = null;
    let alarmMessage = null;

    if (percentage <= 10 || volume <= 50) {
      status = 'critical';
      alarmType = 'EMPTY_BAG';
      alarmMessage = `Labu infus pada ${deviceId} hampir habis (sisa ${percentage}% / ${volume} mL)!`;
    } else if (flowRate === 0 && percentage > 15) {
      status = 'critical';
      alarmType = 'OCCLUSION';
      alarmMessage = `Aliran infus terhenti atau mampet pada ${deviceId}!`;
    } else if (battery <= 20) {
      status = 'critical';
      alarmType = 'LOW_BATTERY';
      alarmMessage = `Baterai perangkat ${deviceId} rendah (${battery}%)!`;
    } else if (percentage <= 20) {
      status = 'warning';
    }

    await query(`
      INSERT INTO mifus_device_telemetry
        (device_id, current_volume, flow_rate, percentage, battery_level, status, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (device_id)
      DO UPDATE SET
        current_volume = EXCLUDED.current_volume,
        flow_rate = EXCLUDED.flow_rate,
        percentage = EXCLUDED.percentage,
        battery_level = EXCLUDED.battery_level,
        status = EXCLUDED.status,
        updated_at = NOW()
    `, [deviceId.trim(), volume, flowRate, percentage, battery, status]);

    if (alarmType) {
      const existing = await query(`
        SELECT id FROM mifus_alarm_events
        WHERE device_id = $1 AND alarm_type = $2 AND is_resolved = false
        LIMIT 1
      `, [deviceId.trim(), alarmType]);

      if (existing.rows.length === 0) {
        await query(`
          INSERT INTO mifus_alarm_events (device_id, alarm_type, message)
          VALUES ($1, $2, $3)
        `, [deviceId.trim(), alarmType, alarmMessage]);
      }
    }

    return res.status(200).json({ success: true, status, alarmType });
  } catch (err) {
    return res.status(err.status || 500).json({
      error: err.status ? err.message : 'Gagal menyimpan telemetri perangkat',
    });
  }
}
