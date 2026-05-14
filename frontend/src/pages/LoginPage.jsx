// src/pages/LoginPage.jsx — Login Form
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { loginUser, selectAuthLoading, selectIsAuthenticated, clearError } from '../store/slices/authSlice';

function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isLoading = useSelector(selectAuthLoading);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    dispatch(clearError());
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginUser(form));
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏸</div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Login to your ShuttlePro account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-icon-wrapper">
              <FiMail className="input-icon" />
              <input
                type="email"
                className="form-input input-with-icon"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-icon-wrapper">
              <FiLock className="input-icon" />
              <input
                type={showPass ? 'text' : 'password'}
                className="form-input input-with-icon"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button type="button" className="input-icon-right" onClick={() => setShowPass(!showPass)} tabIndex={-1}>
                {showPass ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Demo credentials */}
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(99,102,241,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99,102,241,0.15)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Demo Accounts</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <button className="demo-cred" onClick={() => setForm({ email: 'admin@shuttlepro.com', password: 'admin123' })}>
              🛡️ Admin: admin@shuttlepro.com / admin123
            </button>
            <button className="demo-cred" onClick={() => setForm({ email: 'player@shuttlepro.com', password: 'player123' })}>
              🏸 Player: player@shuttlepro.com / player123
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Sign Up</Link>
        </p>
      </div>

      <style>{`
        .auth-page {
          min-height: calc(100vh - var(--nav-height));
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.1) 0%, transparent 70%);
        }
        .auth-card {
          width: 100%;
          max-width: 420px;
          padding: 2.5rem;
        }
        .input-icon-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 0.875rem;
          color: var(--text-muted);
          font-size: 0.9rem;
          pointer-events: none;
        }
        .input-with-icon {
          padding-left: 2.5rem !important;
        }
        .input-icon-right {
          position: absolute;
          right: 0.875rem;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0;
        }
        .demo-cred {
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 0.75rem;
          cursor: pointer;
          text-align: left;
          padding: 0.25rem 0;
          font-family: monospace;
          transition: var(--transition);
        }
        .demo-cred:hover { color: var(--primary-light); }
      `}</style>
    </div>
  );
}

export default LoginPage;
