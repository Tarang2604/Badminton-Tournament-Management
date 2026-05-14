// src/pages/AdminPage.jsx — Admin Panel
import { useEffect, useState } from 'react';
import { userAPI, tournamentAPI } from '../services/api';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTournaments, selectTournaments, deleteTournament } from '../store/slices/tournamentSlice';
import TournamentForm from '../components/tournaments/TournamentForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function AdminPage() {
  const dispatch = useDispatch();
  const tournaments = useSelector(selectTournaments);

  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    Promise.allSettled([
      userAPI.getAll({ limit: 50 }),
      tournamentAPI.getStats(),
      dispatch(fetchTournaments({ limit: 50 })),
    ]).then((results) => {
      if (results[0].status === 'fulfilled') setUsers(results[0].value.data.users || []);
      if (results[1].status === 'fulfilled') setStats(results[1].value.data.stats);
    }).finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId, role) => {
    try {
      await userAPI.updateRole(userId, role);
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, role } : u));
      toast.success(`Role updated to ${role}`);
    } catch { toast.error('Failed to update role'); }
  };

  const handleDeactivate = async (userId) => {
    try {
      const res = await userAPI.deactivate(userId);
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, isActive: res.data.isActive } : u));
      toast.success(res.data.message);
    } catch { toast.error('Failed'); }
  };

  const handleDeleteTournament = async (id) => {
    if (!window.confirm('Delete this tournament and all its data?')) return;
    dispatch(deleteTournament(id));
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (loading) return <LoadingSpinner text="Loading admin panel..." />;

  const tabs = ['overview', 'tournaments', 'users'];

  return (
    <div className="container page-wrapper animate-fade">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem' }}>🛡️ Admin Panel</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Full system control</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.625rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'Inter', fontWeight: 600, fontSize: '0.9rem',
              color: activeTab === tab ? 'var(--primary-light)' : 'var(--text-muted)',
              borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
              transition: 'var(--transition)', textTransform: 'capitalize',
            }}>{tab}</button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && stats && (
        <div>
          <div className="grid-4" style={{ marginBottom: '2rem' }}>
            {[
              { icon: '🏆', label: 'Total Tournaments', value: stats.totalTournaments },
              { icon: '🔴', label: 'Live Now', value: stats.ongoing },
              { icon: '📅', label: 'Upcoming', value: stats.upcoming },
              { icon: '👥', label: 'Total Players', value: users.filter((u) => u.role === 'player').length },
            ].map((s, i) => (
              <div key={i} className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
                  <span style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--primary-light)' }}>{s.value}</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{s.label}</p>
              </div>
            ))}
          </div>
          <div className="grid-2">
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Recent Users</h3>
              {users.slice(0, 5).map((u) => (
                <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                    {u.name[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                  </div>
                  <span className={`badge ${u.role === 'admin' ? 'badge-error' : u.role === 'organizer' ? 'badge-primary' : 'badge-gray'}`} style={{ fontSize: '0.7rem' }}>{u.role}</span>
                </div>
              ))}
            </div>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Recent Tournaments</h3>
              {tournaments.slice(0, 5).map((t) => (
                <div key={t._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '1.1rem' }}>🏸</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{t.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.venue?.city}</div>
                  </div>
                  <span className={`badge ${t.status === 'ongoing' ? 'badge-primary' : t.status === 'registration_open' ? 'badge-success' : 'badge-gray'}`} style={{ fontSize: '0.7rem' }}>{t.status.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tournaments */}
      {activeTab === 'tournaments' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create Tournament</button>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Name</th><th>Organizer</th><th>City</th><th>Status</th><th>Players</th><th>Date</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {tournaments.map((t) => (
                  <tr key={t._id}>
                    <td style={{ fontWeight: 600 }}>{t.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{t.organizer?.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{t.venue?.city}</td>
                    <td><span className={`badge ${t.status === 'ongoing' ? 'badge-primary' : t.status === 'registration_open' ? 'badge-success' : 'badge-gray'}`} style={{ fontSize: '0.7rem' }}>{t.status.replace(/_/g, ' ')}</span></td>
                    <td>{t.registeredCount}/{t.maxParticipants}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{format(new Date(t.startDate), 'MMM d, yyyy')}</td>
                    <td>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDeleteTournament(t._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users */}
      {activeTab === 'users' && (
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <input type="text" className="form-input" placeholder="Search users by name or email..."
              value={userSearch} onChange={(e) => setUserSearch(e.target.value)} style={{ maxWidth: '400px' }} />
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>City</th><th>Matches</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{u.email}</td>
                    <td>
                      <select value={u.role} onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', padding: '0.25rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                        <option value="player">player</option>
                        <option value="organizer">organizer</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.city || '—'}</td>
                    <td>{u.stats?.matchesPlayed ?? 0}</td>
                    <td><span className={`badge ${u.isActive ? 'badge-success' : 'badge-error'}`} style={{ fontSize: '0.7rem' }}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <button className="btn btn-sm btn-ghost" onClick={() => handleDeactivate(u._id)}>
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreate && <TournamentForm onClose={() => setShowCreate(false)} />}
    </div>
  );
}

export default AdminPage;
