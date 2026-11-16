import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import FormError from '../components/FormError';

export default function SignupPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await register(form);
    } catch (err) {
      setError(err);
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <h1>Create your account</h1>
        <fieldset className="role-picker">
          <legend>I am a</legend>
          <label>
            <input type="radio" name="role" value="patient" checked={form.role === 'patient'} onChange={update('role')} />
            Patient
          </label>
          <label>
            <input type="radio" name="role" value="doctor" checked={form.role === 'doctor'} onChange={update('role')} />
            Doctor
          </label>
        </fieldset>
        <label>
          Name
          <input value={form.name} onChange={update('name')} autoComplete="name" />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={update('email')} autoComplete="email" />
        </label>
        <label>
          Password
          <input type="password" value={form.password} onChange={update('password')} autoComplete="new-password" />
          <small>At least 8 characters</small>
        </label>
        <FormError error={error} />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
