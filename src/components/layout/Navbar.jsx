import { useAuth } from '../../context/AuthContext';

const ROLE_LABEL = { manager: 'Manager', nurse: 'Perawat' };

export default function Navbar({ sidebarOpen, onToggle }) {
  const { user } = useAuth();
  return (
    <header className="mifus-navbar">
      <button type="button" className="mifus-sidebar-toggle" onClick={onToggle} aria-label={sidebarOpen ? 'Tutup navigasi' : 'Buka navigasi'}>
        {sidebarOpen ? '‹' : '☰'}
      </button>
      <div><span>Smart Infusion Monitoring</span><h1>Dashboard Pemantauan</h1></div>
      <div className="mifus-user-summary"><strong>{user?.name}</strong><span>{ROLE_LABEL[user?.role]}</span></div>
    </header>
  );
}
