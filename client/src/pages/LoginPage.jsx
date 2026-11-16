import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import FormError from '../components/FormError';
import BrandMark from '../components/BrandMark';
import PasswordField from '../components/PasswordField';
import useDocumentTitle from '../useDocumentTitle';

export default function LoginPage() {
  useDocumentTitle('Log in');
  const { login, notice } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(form);
    } catch (err) {
      setError(err);
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <span className="brand">
          <BrandMark size={32} />
          Sweety
        </span>
        <form onSubmit={handleSubmit} noValidate>
          <h1>Log in</h1>
          {notice && (
            <p className="notice" role="status">
              {notice}
            </p>
          )}
          <label>
            Email
            <input type="email" value={form.email} onChange={update('email')} autoComplete="email" />
          </label>
          <PasswordField value={form.password} onChange={update('password')} autoComplete="current-password" />
          <FormError error={error} />
          <button type="submit" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>
        <p className="auth-switch">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
