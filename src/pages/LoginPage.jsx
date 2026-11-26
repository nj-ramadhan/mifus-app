import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal login ke MIFUS');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mifus-login">
      <section className="mifus-login-card" aria-label="Login MIFUS">
        <div className="mifus-login-brand">
          <img className="mifus-login-logo" src="/icon-mifus.png" alt="MIFUS" />
          <div>
            <h1>Portal MIFUS</h1>
            <p>Smart Infusion Monitoring</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="mifus-login-form">
          {error && <p className="mifus-error" role="alert">{error}</p>}
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <label htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <button type="submit" disabled={loading}>{loading ? 'Memeriksa...' : 'Masuk'}</button>
        </form>
      </section>
    </main>
  );
}
