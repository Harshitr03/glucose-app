import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ReadingsPage from './pages/patient/ReadingsPage';
import ReportsPage from './pages/patient/ReportsPage';
import DoctorsPage from './pages/patient/DoctorsPage';
import PatientsPage from './pages/doctor/PatientsPage';
import PatientDetailPage from './pages/doctor/PatientDetailPage';

function homeFor(user) {
  return user.role === 'doctor' ? '/patients' : '/readings';
}

function RequireRole({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={homeFor(user)} replace />;
  return <Layout>{children}</Layout>;
}

function PublicOnly({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to={homeFor(user)} replace /> : children;
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <p className="page-loading">Loading…</p>;

  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/signup" element={<PublicOnly><SignupPage /></PublicOnly>} />

      <Route path="/readings" element={<RequireRole role="patient"><ReadingsPage /></RequireRole>} />
      <Route path="/reports" element={<RequireRole role="patient"><ReportsPage /></RequireRole>} />
      <Route path="/doctors" element={<RequireRole role="patient"><DoctorsPage /></RequireRole>} />

      <Route path="/patients" element={<RequireRole role="doctor"><PatientsPage /></RequireRole>} />
      <Route path="/patients/:id" element={<RequireRole role="doctor"><PatientDetailPage /></RequireRole>} />

      <Route path="*" element={<Navigate to={user ? homeFor(user) : '/login'} replace />} />
    </Routes>
  );
}
