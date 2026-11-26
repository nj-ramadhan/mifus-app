import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ROLE_LABEL = { manager: 'Manager', nurse: 'Perawat' };

export default function Sidebar({ open, onToggle }) {
  const { user, logout } = useAuth();

  return (
    <aside className="mifus-sidebar" aria-hidden={!open}>
      <button type="button" className="sidebar-close" onClick={onToggle} aria-label="Tutup navigasi">×</button>
      <div className="mifus-brand">
        <span className="mifus-mark">M</span>
        <div><strong>MIFUS</strong><small>Infusion Monitor</small></div>
      </div>
      <nav className="mifus-nav" aria-label="Navigasi utama">
        <NavLink to="/dashboard" end className={({ isActive }) => `mifus-nav-link ${isActive ? 'active' : ''}`}>
          Monitoring Infus
        </NavLink>
      </nav>
      <div className="mifus-profile">
        <div className="mifus-avatar">{user?.name?.charAt(0)?.toUpperCase() || 'M'}</div>
        <div><strong>{user?.name || 'Pengguna'}</strong><span>{ROLE_LABEL[user?.role] || user?.role}</span></div>
      </div>
      <button type="button" className="mifus-logout" onClick={logout}>Keluar</button>
    </aside>
  );
}
