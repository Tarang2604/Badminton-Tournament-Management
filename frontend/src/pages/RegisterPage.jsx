// src/pages/RegisterPage.jsx — Registration Form
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiUser, FiMail, FiLock, FiPhone, FiMapPin, FiEye, FiEyeOff } from 'react-icons/fi';
import { registerUser, selectAuthLoading } from '../store/slices/authSlice';

function RegisterPage() {
  const dispatch = useDispatch();
  const isLoading = useSelector(selectAuthLoading);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'player', phone: '', city: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(registerUser(form));
  };

  const inputStyle = { position: 'relative', display: 'flex', alignItems: 'center' };
  const iconStyle = { position: 'absolute', left: '0.875rem', color: 'var(--text-muted)', fontSize: '0.9rem', pointerEvents: 'none' };
  const withIconStyle = { paddingLeft: '2.5rem' };

  return (
    <div style={{
      minHeight: 'calc(100vh - var(--nav-height))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem',
      background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.1) 0%, transparent 70%)',
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏸</div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Create Account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Join the ShuttlePro community</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <div style={inputStyle}>
              <FiUser style={iconStyle} />
              <input type="text" className="form-input" style={withIconStyle} placeholder="Prakash Padukone"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email *</label>
            <div style={inputStyle}>
              <FiMail style={iconStyle} />
              <input type="email" className="form-input" style={withIconStyle} placeholder="you@example.com"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password *</label>
            <div style={inputStyle}>
              <FiLock style={iconStyle} />
              <input type={showPass ? 'text' : 'password'} className="form-input" style={withIconStyle}
                placeholder="Min. 6 characters"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '0.875rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {showPass ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div className="form-group">
            <label className="form-label">I am a...</label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {['player', 'organizer'].map((role) => (
                <label key={role} style={{
                  flex: 1, padding: '0.75rem', border: `2px solid ${form.role === role ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'center',
                  background: form.role === role ? 'rgba(99,102,241,0.1)' : 'transparent',
                  transition: 'var(--transition)',
                }}>
                  <input type="radio" name="role" value={role} checked={form.role === role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })} style={{ display: 'none' }} />
                  <span style={{ fontSize: '1.1rem', display: 'block', marginBottom: '0.25rem' }}>
                    {role === 'player' ? '🏸' : '🎯'}
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'capitalize', color: form.role === role ? 'var(--primary-light)' : 'var(--text-secondary)' }}>
                    {role}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Phone & City */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <div style={inputStyle}>
                <FiPhone style={iconStyle} />
                <input type="tel" className="form-input" style={withIconStyle} placeholder="+91 98765..."
                  value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <div style={inputStyle}>
                <FiMapPin style={iconStyle} />
                <input type="text" className="form-input" style={withIconStyle} placeholder="Indore"
                  value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Login</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
