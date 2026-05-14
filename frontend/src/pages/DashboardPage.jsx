// src/pages/DashboardPage.jsx — Player & Organizer Dashboard
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiCalendar, FiAward, FiTrendingUp, FiActivity } from 'react-icons/fi';
import { selectUser, selectIsOrganizer } from '../store/slices/authSlice';
import { registrationAPI, matchAPI, tournamentAPI, userAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { format } from 'date-fns';

const statusColors = {
  upcoming: 'badge-info', registration_open: 'badge-success', registration_closed: 'badge-warning',
  ongoing: 'badge-primary', completed: 'badge-gray', cancelled: 'badge-error',
};

function StatCard({ icon, label, value, color = 'var(--primary-light)' }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
        <span style={{ color, fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Space Grotesk' }}>{value}</span>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>{label}</p>
    </div>
  );
}

function DashboardPage() {
  const user = useSelector(selectUser);
  const isOrganizer = useSelector(selectIsOrganizer);

  const [myRegistrations, setMyRegistrations] = useState([]);
  const [myMatches, setMyMatches] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [orgStats, setOrgStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const promises = [
          registrationAPI.getMyRegistrations(),
          matchAPI.getByPlayer(user._id),
          userAPI.getLeaderboard(5),
        ];
        if (isOrganizer) promises.push(tournamentAPI.getStats());

        const results = await Promise.allSettled(promises);
        if (results[0].status === 'fulfilled') setMyRegistrations(results[0].value.data.registrations || []);
        if (results[1].status === 'fulfilled') setMyMatches(results[1].value.data.matches || []);
        if (results[2].status === 'fulfilled') setLeaderboard(results[2].value.data.players || []);
        if (results[3]?.status === 'fulfilled') setOrgStats(results[3].value.data.stats);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user, isOrganizer]);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  const approvedTournaments = myRegistrations.filter((r) => r.status === 'approved').length;
  const pendingRegistrations = myRegistrations.filter((r) => r.status === 'pending').length;

  return (
    <div className="container page-wrapper animate-fade">
      {/* Welcome */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem' }}>
          Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>! 🏸
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', textTransform: 'capitalize' }}>
          {user?.role} Dashboard
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        {isOrganizer ? (
          <>
            <StatCard icon="🏆" label="Total Tournaments" value={orgStats?.totalTournaments ?? 0} />
            <StatCard icon="🔴" label="Live Now" value={orgStats?.ongoing ?? 0} color="var(--error)" />
            <StatCard icon="📅" label="Upcoming" value={orgStats?.upcoming ?? 0} color="var(--accent-light)" />
            <StatCard icon="✅" label="Completed" value={orgStats?.completed ?? 0} color="#34d399" />
          </>
        ) : (
          <>
            <StatCard icon="🏸" label="Tournaments Joined" value={approvedTournaments} />
            <StatCard icon="⏳" label="Pending Approvals" value={pendingRegistrations} color="var(--accent-light)" />
            <StatCard icon="🎯" label="Matches Played" value={user?.stats?.matchesPlayed ?? 0} />
            <StatCard icon="🏆" label="Win Rate" value={`${user?.stats?.winRate ?? 0}%`} color="#34d399" />
          </>
        )}
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* My Tournaments */}
        <div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
            {isOrganizer ? '🏆 My Tournaments' : '📋 My Registrations'}
          </h2>
          {myRegistrations.length === 0 ? (
            <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>
                {isOrganizer ? 'No tournaments created yet.' : 'You haven\'t registered for any tournaments.'}
              </p>
              <Link to="/tournaments" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                Browse Tournaments
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {myRegistrations.slice(0, 6).map((reg) => (
                <Link key={reg._id} to={`/tournaments/${reg.tournament?._id}`} style={{ textDecoration: 'none' }}>
                  <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🏸</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {reg.tournament?.name}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {reg.tournament?.venue?.city} •{' '}
                        {reg.tournament?.startDate && format(new Date(reg.tournament.startDate), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <span className={`badge ${statusColors[reg.tournament?.status] || 'badge-gray'}`} style={{ fontSize: '0.7rem' }}>
                      {reg.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Recent Matches */}
          <div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>⚔️ Recent Matches</h2>
            {myMatches.length === 0 ? (
              <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No matches played yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {myMatches.slice(0, 5).map((match) => {
                  const isWinner = match.winner?._id === user?._id;
                  const opponent = match.player1?._id === user?._id ? match.player2 : match.player1;
                  return (
                    <div key={match._id} className="glass-card" style={{ padding: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.1rem' }}>{isWinner ? '🏆' : match.status === 'completed' ? '😔' : '⚔️'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>vs {opponent?.name || 'TBD'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{match.tournament?.name}</div>
                      </div>
                      {match.status === 'completed' && (
                        <span className={`badge ${isWinner ? 'badge-success' : 'badge-error'}`} style={{ fontSize: '0.7rem' }}>
                          {isWinner ? 'Won' : 'Lost'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Leaderboard Preview */}
          <div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>🏅 Top Players</h2>
            <div className="glass-card" style={{ padding: '1rem' }}>
              {leaderboard.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>No data yet.</p>
              ) : (
                leaderboard.map((player, i) => (
                  <div key={player._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0', borderBottom: i < leaderboard.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ minWidth: '24px', fontSize: '0.9rem', fontWeight: 700, color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7c2f' : 'var(--text-muted)' }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{player.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{player.city}</div>
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#34d399' }}>{player.stats?.winRate}%</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
