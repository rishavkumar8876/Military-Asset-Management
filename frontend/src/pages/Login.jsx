import { useState, useContext } from 'react';
import { Shield } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-logo">
          <h1><Shield size={36} color="#f59e0b" /> M.A.M.S</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
            Military Asset Management System
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-red)', padding: '12px', borderRadius: '6px', marginBottom: '20px', border: '1px solid var(--danger-red)', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="admin@military.gov"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>

        <div style={{ marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px' }}>
          <strong>Demo Accounts:</strong><br />
          Admin: <code>admin@military.gov</code><br />
          Commander: <code>shepard@foba.gov</code><br />
          logistics: <code>jenkins@nsb.gov</code><br />
          <span style={{ color: 'var(--text-muted)' }}>Password for all: <code>password123</code></span>
        </div>
      </div>
    </div>
  );
};

export default Login;
