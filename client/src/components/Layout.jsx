import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import BrandMark from './BrandMark';

const LINKS = {
  patient: [
    { to: '/readings', label: 'Readings' },
    { to: '/reports', label: 'Reports' },
    { to: '/doctors', label: 'My doctors' },
  ],
  doctor: [{ to: '/patients', label: 'Patients' }],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();

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
