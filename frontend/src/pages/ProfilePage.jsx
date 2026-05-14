// src/pages/ProfilePage.jsx — Player Profile with Stats
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, selectIsAuthenticated, updateProfile } from '../store/slices/authSlice';
import { userAPI, matchAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { format } from 'date-fns';

function ProfilePage() {
  const { id } = useParams(); // If no ID, show own profile
  const dispatch = useDispatch();
  const currentUser = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [profileUser, setProfileUser] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', city: '' });

  const isOwnProfile = !id || id === currentUser?._id;

  useEffect(() => {
    const targetId = id || currentUser?._id;
    if (!targetId) return;

    Promise.allSettled([
      userAPI.getById(targetId),
      matchAPI.getByPlayer(targetId),
    ]).then((results) => {
      if (results[0].status === 'fulfilled') {
        const u = results[0].value.data.user;
        setProfileUser(u);
        setEditForm({ name: u.name, phone: u.phone || '', city: u.city || '' });
      }
      if (results[1].status === 'fulfilled') setMatches(results[1].value.data.matches || []);
    }).finally(() => setLoading(false));
  }, [id, currentUser]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    await dispatch(updateProfile(editForm));
    setEditing(false);
    // Refresh
    const res = await userAPI.getById(currentUser._id);
    setProfileUser(res.data.user);
  };

  if (loading) return <LoadingSpinner text="Loading profile..." />;
  if (!profileUser) return <div className="container page-wrapper"><p>User not found.</p></div>;

  const { name, email, city, role, stats, createdAt } = profileUser;

  return (
    <div className="container page-wrapper animate-fade">
      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Left: Profile Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
            {/* Avatar */}
            <div style={{
              width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 800,
              color: 'white', margin: '0 auto 1rem', boxShadow: '0 8px 30px var(--primary-glow)',
            }}>
              {name?.[0]?.toUpperCase()}
            </div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{email}</p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <span className={`badge ${role === 'admin' ? 'badge-error' : role === 'organizer' ? 'badge-primary' : 'badge-gray'}`}>
                {role}
              </span>
              {city && <span className="badge badge-gray">📍 {city}</span>}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '1rem' }}>
              Member since {format(new Date(createdAt), 'MMM yyyy')}
            </p>

            {isOwnProfile && !editing && (
              <button className="btn btn-ghost btn-sm" style={{ marginTop: '1rem' }} onClick={() => setEditing(true)}>
                ✏️ Edit Profile
              </button>
            )}
          </div>

          {/* Edit Form */}
          {editing && isOwnProfile && (
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Edit Profile</h3>
              <form onSubmit={handleSaveProfile}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input className="form-input" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save</button>
                </div>
              </form>
            </div>
          )}

          {/* Stats */}
          {role === 'player' && (
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>📊 Career Stats</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {[
                  { label: 'Matches Played', value: stats?.matchesPlayed ?? 0 },
                  { label: 'Matches Won', value: stats?.matchesWon ?? 0, color: '#34d399' },
                  { label: 'Matches Lost', value: stats?.matchesLost ?? 0, color: '#f87171' },
                  { label: 'Tournaments Played', value: stats?.tournamentsPlayed ?? 0 },
                  { label: 'Tournaments Won', value: stats?.tournamentsWon ?? 0, color: '#fbbf24' },
                  { label: 'Win Rate', value: `${stats?.winRate ?? 0}%`, color: '#34d399' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{s.label}</span>
                    <span style={{ fontWeight: 700, color: s.color || 'var(--text-primary)' }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Match History */}
        <div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>⚔️ Match History</h2>
          {matches.length === 0 ? (
            <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>No matches played yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {matches.map((match) => {
                const isWinner = match.winner?._id === profileUser._id;
                const opponent = match.player1?._id === profileUser._id ? match.player2 : match.player1;
                return (
                  <div key={match._id} className="glass-card" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{match.tournament?.name}</span>
                      <span className={`badge ${isWinner ? 'badge-success' : match.status === 'completed' ? 'badge-error' : 'badge-gray'}`} style={{ fontSize: '0.7rem' }}>
                        {match.status === 'completed' ? (isWinner ? 'Won' : 'Lost') : match.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>vs {opponent?.name || 'TBD'}</span>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        {match.sets?.map((set, i) => (
                          <span key={i} style={{ fontSize: '0.8rem', padding: '0.125rem 0.375rem', background: 'var(--border)', borderRadius: 4 }}>
                            {match.player1?._id === profileUser._id ? set.player1Score : set.player2Score}-
                            {match.player1?._id === profileUser._id ? set.player2Score : set.player1Score}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
                      {match.roundName} • {match.tournament?.venue?.city}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
