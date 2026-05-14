// src/pages/NotFoundPage.jsx — 404 Page
import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div style={{
      minHeight: 'calc(100vh - var(--nav-height))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', textAlign: 'center', padding: '2rem',
    }}>
      <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🏸</div>
      <h1 style={{ fontSize: '6rem', fontWeight: 900, lineHeight: 1, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Page Not Found</h2>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '2rem' }}>
        The shuttlecock went out of bounds! This page doesn't exist.
      </p>
      <Link to="/" className="btn btn-primary">← Back to Home</Link>
    </div>
  );
}

export default NotFoundPage;
