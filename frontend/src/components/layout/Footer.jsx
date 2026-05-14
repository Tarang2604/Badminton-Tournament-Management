// src/components/layout/Footer.jsx
import { Link } from 'react-router-dom';

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer style={{
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border)',
      padding: '2rem 0',
      marginTop: 'auto',
    }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🏸</span>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text-primary)' }}>ShuttlePro</span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link to="/tournaments" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Tournaments</Link>
            <Link to="/register" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Register</Link>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            © {year} ShuttlePro — Badminton Tournament Management
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
