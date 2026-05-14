// src/pages/HomePage.jsx — Landing Page
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiArrowRight, FiAward, FiUsers, FiCalendar, FiTrendingUp } from 'react-icons/fi';
import { fetchTournaments, selectTournaments } from '../store/slices/tournamentSlice';
import TournamentCard from '../components/common/TournamentCard';
import './HomePage.css';

const FEATURES = [
  { icon: '🏆', title: 'Smart Brackets', desc: 'Auto-generated single/double elimination and round-robin draws with seeding.' },
  { icon: '📊', title: 'Live Scores', desc: 'Real-time score updates and match results as they happen.' },
  { icon: '👤', title: 'Player Profiles', desc: 'Track stats, win rates, and tournament history for every player.' },
  { icon: '🎯', title: 'Easy Registration', desc: 'Players register in seconds; organizers approve with one click.' },
];

function HomePage() {
  const dispatch = useDispatch();
  const tournaments = useSelector(selectTournaments);

  useEffect(() => {
    dispatch(fetchTournaments({ limit: 6, status: 'registration_open' }));
  }, [dispatch]);

  return (
    <div>
      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="container hero-content">
          <div className="hero-badge">
            <span>🏸</span> Badminton Tournament Platform
          </div>
          <h1 className="hero-title">
            Manage Tournaments<br />
            <span className="gradient-text">Like a Champion</span>
          </h1>
          <p className="hero-subtitle">
            The all-in-one platform for organizing and playing competitive badminton tournaments.
            Automated brackets, live scores, and real-time leaderboards.
          </p>
          <div className="hero-actions">
            <Link to="/tournaments" className="btn btn-primary btn-lg">
              Browse Tournaments <FiArrowRight />
            </Link>
            <Link to="/register" className="btn btn-ghost btn-lg">
              Join Free →
            </Link>
          </div>

          {/* Stats */}
          <div className="hero-stats">
            <div className="hero-stat"><span>500+</span><p>Players</p></div>
            <div className="hero-stat"><span>50+</span><p>Tournaments</p></div>
            <div className="hero-stat"><span>1000+</span><p>Matches</p></div>
            <div className="hero-stat"><span>15+</span><p>Cities</p></div>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>Everything You Need</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
              From bracket generation to final results — managed in one place.
            </p>
          </div>
          <div className="grid-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div className="feature-icon">{f.icon}</div>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Open Tournaments ──────────────────────────────────────── */}
      {tournaments.length > 0 && (
        <section className="section" style={{ background: 'var(--bg-secondary)', padding: '4rem 0' }}>
          <div className="container">
            <div className="section-header">
              <div>
                <h2 style={{ fontSize: '1.75rem' }}>Open Tournaments</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Register now before spots fill up</p>
              </div>
              <Link to="/tournaments" className="btn btn-ghost">View All →</Link>
            </div>
            <div className="grid-3">
              {tournaments.slice(0, 3).map((t) => (
                <TournamentCard key={t._id} tournament={t} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card glass-card">
            <h2 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
              Ready to Play?
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
              Join ShuttlePro today and take your badminton game to the next level.
            </p>
            <Link to="/register" className="btn btn-primary btn-lg">
              Create Free Account <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
