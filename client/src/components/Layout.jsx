import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import BrandMark from './BrandMark';

const LINKS = {
  patient: [
    { to: '/readings', label: 'Readings' },
    { to: '/reports', label: 'Reports' },
    { to: '/doctors', label: 'My doctors', badge: 'invites' },
  ],
  doctor: [{ to: '/patients', label: 'Patients' }],
};

function usePendingInvites(enabled) {
  const location = useLocation();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    function refresh() {
      api('/doctors')
        .then((data) => active && setCount(data.doctors.filter((doctor) => doctor.status === 'pending').length))
        .catch(() => {});
    }
    refresh();
    window.addEventListener('sweety:invites-changed', refresh);
    return () => {
      active = false;
      window.removeEventListener('sweety:invites-changed', refresh);
    };
  }, [enabled, location.pathname]);

  return count;
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const pendingInvites = usePendingInvites(user.role === 'patient');

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          <BrandMark />
          Sweety
        </Link>
        <nav aria-label="Main">
          {LINKS[user.role].map((link) => (
            <NavLink key={link.to} to={link.to}>
              {link.label}
              {link.badge === 'invites' && pendingInvites > 0 && (
                <span className="nav-badge" aria-label={`${pendingInvites} new invitation${pendingInvites === 1 ? '' : 's'}`}>
                  {pendingInvites}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="topbar-user">
          <span>{user.name}</span>
          <button type="button" className="link-button" onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      <main className="page">{children}</main>
    </div>
  );
}
