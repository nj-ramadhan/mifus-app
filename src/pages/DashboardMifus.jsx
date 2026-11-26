import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import InfusionBottle from '../components/InfusionBottle';
import FlowRateWidget from '../components/FlowRateWidget';

const STATUS_LABEL = { normal: 'Normal', warning: 'Perhatian', critical: 'Kritis', offline: 'Offline' };

// Fungsi bantu hitung estimasi waktu habis
function calculateTimeToEmpty(volume, flowRate) {
  if (!flowRate || flowRate <= 0 || !volume || volume <= 0) return 'Tidak terdeteksi';
  const totalSeconds = volume / flowRate;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) return `~${hours} jam ${minutes} mnt`;
  return `~${minutes} menit`;
}

export default function DashboardMifus() {
  const { user } = useAuth();
  const [devices, setDevices] = useState([]);
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionNotice, setActionNotice] = useState('');
  const [deviceForm, setDeviceForm] = useState({ id: '', room_number: '', bed_number: '' });
  const [patientForm, setPatientForm] = useState({
    name: '',
    medical_record_number: '',
    diagnosis: '',
    device_id: '',
    total_volume_prescribed: 500,
  });
  const [nurseForm, setNurseForm] = useState({ name: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    setError('');
    try {
      const { data } = await client.get('/dashboard');
      setDevices(Array.isArray(data.devices) ? data.devices : []);
      setAlarms(Array.isArray(data.activeAlarms) ? data.activeAlarms : []);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memuat data telemetri MIFUS');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const interval = window.setInterval(load, 10000);
    return () => window.clearInterval(interval);
  }, []);

  async function resolveAlarm(alarmId) {
    setActionError('');
    try {
      await client.put('/alarms', { id: alarmId });
      await load();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Alarm tidak dapat diselesaikan');
    }
  }

  async function createDevice(event) {
    event.preventDefault();
    setSaving(true);
    setActionError('');
    setActionNotice('');
    try {
      await client.post('/devices', deviceForm);
      setDeviceForm({ id: '', room_number: '', bed_number: '' });
      await load();
      setActionNotice('Perangkat berhasil didaftarkan.');
    } catch (err) {
      setActionError(err.response?.data?.error || 'Perangkat tidak dapat didaftarkan');
    } finally {
      setSaving(false);
    }
  }

  async function createPatient(event) {
    event.preventDefault();
    setSaving(true);
    setActionError('');
    setActionNotice('');
    try {
      await client.post('/patients', {
        ...patientForm,
        total_volume_prescribed: Number(patientForm.total_volume_prescribed),
        device_id: patientForm.device_id || null,
      });
      setPatientForm({
        name: '',
        medical_record_number: '',
        diagnosis: '',
        device_id: '',
        total_volume_prescribed: 500,
      });
      await load();
      setActionNotice('Pasien berhasil didaftarkan.');
    } catch (err) {
      setActionError(err.response?.data?.error || 'Pasien tidak dapat didaftarkan');
    } finally {
      setSaving(false);
    }
  }

  async function createNurse(event) {
    event.preventDefault();
    setSaving(true);
    setActionError('');
    setActionNotice('');
    try {
      await client.post('/users', nurseForm);
      setNurseForm({ name: '', email: '', password: '' });
      setActionNotice('Akun perawat berhasil dibuat.');
    } catch (err) {
      setActionError(err.response?.data?.error || 'Akun perawat tidak dapat dibuat');
    } finally {
      setSaving(false);
    }
  }

  const criticalCount = devices.filter((device) => device.status === 'critical').length;
  const warningCount = devices.filter((device) => device.status === 'warning').length;
  const canResolve = user?.role === 'manager' || user?.role === 'nurse';
  const canManage = user?.role === 'manager';

  return (
    <div className="mifus-dashboard">
      {error && <p className="mifus-error" role="alert">{error}</p>}
      {actionError && <p className="mifus-error" role="alert">{actionError}</p>}
      {actionNotice && <p className="mifus-success" role="status">{actionNotice}</p>}

      <section className="mifus-stat-grid" aria-label="Ringkasan perangkat">
        <article><span>Perangkat</span><strong>{devices.length}</strong></article>
        <article className="critical"><span>Kritis</span><strong>{criticalCount}</strong></article>
        <article className="warning"><span>Perhatian</span><strong>{warningCount}</strong></article>
        <article className="alarm"><span>Alarm aktif</span><strong>{alarms.length}</strong></article>
      </section>

      {canManage && (
        <section className="mifus-panel">
          <div className="mifus-panel-heading"><div><span>Administrasi</span><h2>Daftarkan perangkat dan pasien</h2></div></div>
          <div className="mifus-management-grid">
            <form onSubmit={createDevice}>
              <h3>Perangkat IoT</h3>
              <label>ID perangkat<input value={deviceForm.id} maxLength="50" onChange={(event) => setDeviceForm({ ...deviceForm, id: event.target.value })} required /></label>
              <label>Ruangan<input value={deviceForm.room_number} onChange={(event) => setDeviceForm({ ...deviceForm, room_number: event.target.value })} /></label>
              <label>Nomor bed<input value={deviceForm.bed_number} onChange={(event) => setDeviceForm({ ...deviceForm, bed_number: event.target.value })} /></label>
              <button type="submit" disabled={saving}>Daftarkan perangkat</button>
            </form>
            <form onSubmit={createPatient}>
              <h3>Pasien rawat inap</h3>
              <label>Nama pasien<input value={patientForm.name} maxLength="100" onChange={(event) => setPatientForm({ ...patientForm, name: event.target.value })} required /></label>
              <label>Nomor rekam medis<input value={patientForm.medical_record_number} maxLength="50" onChange={(event) => setPatientForm({ ...patientForm, medical_record_number: event.target.value })} required /></label>
              <label>Diagnosis<input value={patientForm.diagnosis} onChange={(event) => setPatientForm({ ...patientForm, diagnosis: event.target.value })} /></label>
              <label>Volume resep (mL)<input type="number" min="1" step="1" value={patientForm.total_volume_prescribed} onChange={(event) => setPatientForm({ ...patientForm, total_volume_prescribed: event.target.value })} required /></label>
              <label>Perangkat infus<select value={patientForm.device_id} onChange={(event) => setPatientForm({ ...patientForm, device_id: event.target.value })}><option value="">Belum dialokasikan</option>{devices.filter((device) => !device.patient_id).map((device) => <option key={device.device_id} value={device.device_id}>{device.device_id} · {device.room_number || '-'} / {device.bed_number || '-'}</option>)}</select></label>
              <button type="submit" disabled={saving}>Daftarkan pasien</button>
            </form>
            <form onSubmit={createNurse}>
              <h3>Akun perawat</h3>
              <label>Nama perawat<input value={nurseForm.name} maxLength="100" onChange={(event) => setNurseForm({ ...nurseForm, name: event.target.value })} required /></label>
              <label>Email<input type="email" value={nurseForm.email} maxLength="100" onChange={(event) => setNurseForm({ ...nurseForm, email: event.target.value })} required /></label>
              <label>Password sementara (min. 12 karakter)<input type="password" autoComplete="new-password" value={nurseForm.password} minLength="12" onChange={(event) => setNurseForm({ ...nurseForm, password: event.target.value })} required /></label>
              <button type="submit" disabled={saving}>Buat akun perawat</button>
            </form>
          </div>
        </section>
      )}

      {loading ? (
        <p className="mifus-loading">Memuat data telemetri...</p>
      ) : (
        <>
          <section className="mifus-panel">
            <div className="mifus-panel-heading"><div><span>Realtime</span><h2>Status perangkat</h2></div><small>Perbarui 10 detik</small></div>
            {devices.length === 0 ? (
              <p className="mifus-empty">Belum ada perangkat dalam cakupan.</p>
            ) : (
              <div className="mifus-device-grid">
                {devices.map((device) => (
                  <article key={device.device_id} className={`mifus-device status-${device.status}`}>
                    <div className="mifus-device-heading">
                      <div><span>{device.device_id}</span><h3>{device.patient_name || 'Pasien belum dialokasikan'}</h3></div>
                      <strong>{STATUS_LABEL[device.status] || device.status}</strong>
                    </div>
                    <p className="mifus-location">{device.hospital_name || 'Rumah sakit'} · {device.room_number || '-'} / {device.bed_number || '-'}</p>
                    <div className="mifus-progress" aria-label={`Sisa cairan ${device.percentage}%`}><span style={{ width: `${Math.max(0, Math.min(100, device.percentage))}%` }} /></div>
                    <dl>
                      <InfusionBottle
                        percentage={device.percentage}
                        volume={device.current_volume}
                        totalCapacity={500}
                        flowRate={device.flow_rate}
                        status={device.status}
                        imageSrc="/infus_tabung.png"
                      />
                      <FlowRateWidget
                        flowRate={device.flow_rate}
                        imageSrc="/infus_selang.png"
                      />
                      <div><dt>Sisa cairan</dt><dd>{device.current_volume} mL ({device.percentage}%)</dd></div>
                      <div><dt>Flow rate</dt><dd>{device.flow_rate} mL/s</dd></div>
                      <div><dt>Baterai</dt><dd>{device.battery_level}%</dd></div>
                    </dl>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="mifus-panel mifus-alarm-panel">
            <div className="mifus-panel-heading"><div><span>Triage alarm</span><h2>Alarm aktif</h2></div></div>
            {alarms.length === 0 ? (
              <p className="mifus-empty success">Tidak ada alarm aktif.</p>
            ) : (
              <div className="mifus-alarm-list">
                {alarms.map((alarm) => (
                  <article key={alarm.id}>
                    <div><strong>{alarm.alarm_type}</strong><span>{alarm.device_id} · {alarm.patient_name || 'Pasien belum dialokasikan'}</span></div>
                    <p>{alarm.message}</p>
                    {canResolve && <button type="button" onClick={() => resolveAlarm(alarm.id)}>Selesaikan</button>}
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
