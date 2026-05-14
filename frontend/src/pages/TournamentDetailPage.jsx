// src/pages/TournamentDetailPage.jsx — Tournament Detail & Registration
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiCalendar, FiMapPin, FiUsers, FiAward, FiExternalLink, FiEdit, FiTrash2 } from 'react-icons/fi';
import { format } from 'date-fns';
import { fetchTournamentById, selectCurrentTournament, selectTournamentsLoading, deleteTournament } from '../store/slices/tournamentSlice';
import { selectUser, selectIsAuthenticated, selectIsAdmin, selectIsOrganizer } from '../store/slices/authSlice';
import { registrationAPI, tournamentAPI } from '../services/api';
import TournamentForm from '../components/tournaments/TournamentForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const statusLabels = {
  upcoming: 'Upcoming', registration_open: 'Registration Open', registration_closed: 'Registration Closed',
  ongoing: 'Live 🔴', completed: 'Completed', cancelled: 'Cancelled',
};
const statusColors = {
  upcoming: 'badge-info', registration_open: 'badge-success', registration_closed: 'badge-warning',
  ongoing: 'badge-primary', completed: 'badge-gray', cancelled: 'badge-error',
};

function TournamentDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const tournament = useSelector(selectCurrentTournament);
  const isLoading = useSelector(selectTournamentsLoading);
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);
  const isOrganizer = useSelector(selectIsOrganizer);

  const [showEdit, setShowEdit] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [myRegistration, setMyRegistration] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    dispatch(fetchTournamentById(id));
  }, [id]);

  useEffect(() => {
    if (isAuthenticated && tournament) {
      registrationAPI.getMyRegistrations().then((res) => {
        const found = res.data.registrations?.find((r) => r.tournament?._id === id);
        setMyRegistration(found || null);
      }).catch(() => {});
    }

    if (isOrganizer && tournament) {
      registrationAPI.getByTournament(id).then((res) => setRegistrations(res.data.registrations || [])).catch(() => {});
    }
  }, [isAuthenticated, tournament, isOrganizer]);

  const handleRegister = async () => {
    if (!isAuthenticated) return navigate('/login');
    setRegistering(true);
    try {
      await registrationAPI.register({ tournamentId: id });
      toast.success('Registration submitted! Awaiting approval.');
      // Refresh
      dispatch(fetchTournamentById(id));
      const res = await registrationAPI.getMyRegistrations();
      const found = res.data.registrations?.find((r) => r.tournament?._id === id);
      setMyRegistration(found);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const handleGenerateBracket = async () => {
    setGenerating(true);
    try {
      await tournamentAPI.generateBracket(id);
      toast.success('Bracket generated successfully!');
      dispatch(fetchTournamentById(id));
      navigate(`/tournaments/${id}/bracket`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate bracket');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this tournament and all its data? This cannot be undone.')) return;
    await dispatch(deleteTournament(id)).unwrap();
    navigate('/tournaments');
  };

  const handleApprove = async (regId) => {
    try {
      await registrationAPI.approve(regId);
      toast.success('Registration approved!');
      const res = await registrationAPI.getByTournament(id);
      setRegistrations(res.data.registrations || []);
      dispatch(fetchTournamentById(id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleReject = async (regId) => {
    try {
      await registrationAPI.reject(regId, 'Does not meet criteria');
      toast.success('Registration rejected');
      const res = await registrationAPI.getByTournament(id);
      setRegistrations(res.data.registrations || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  if (isLoading) return <LoadingSpinner text="Loading tournament..." />;
  if (!tournament) return <div className="container page-wrapper"><p>Tournament not found.</p></div>;

  const isOwnTournament = isOrganizer && (tournament.organizer?._id === user?._id || isAdmin);
  const canRegister = tournament.status === 'registration_open' && !myRegistration && user?.role === 'player';

  return (
    <div className="container page-wrapper animate-fade">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span className={`badge ${statusColors[tournament.status]}`}>{statusLabels[tournament.status]}</span>
            <span className="badge badge-gray">{tournament.format?.replace(/_/g, ' ')}</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', marginBottom: '0.5rem' }}>{tournament.name}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Organized by {tournament.organizer?.name}</p>
        </div>
        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link to={`/tournaments/${id}/bracket`} className="btn btn-ghost">
            <FiExternalLink /> View Bracket
          </Link>
          {isOwnTournament && (
            <>
              <button className="btn btn-ghost" onClick={() => setShowEdit(true)}><FiEdit /> Edit</button>
              {tournament.status === 'registration_closed' && (
                <button className="btn btn-accent" onClick={handleGenerateBracket} disabled={generating}>
                  {generating ? 'Generating...' : '⚡ Generate Bracket'}
                </button>
              )}
              {isAdmin && <button className="btn btn-danger" onClick={handleDelete}><FiTrash2 /></button>}
            </>
          )}
          {canRegister && (
            <button className="btn btn-primary btn-lg" onClick={handleRegister} disabled={registering}>
              {registering ? 'Registering...' : '🏸 Register Now'}
            </button>
          )}
          {myRegistration && (
            <span className={`badge ${myRegistration.status === 'approved' ? 'badge-success' : myRegistration.status === 'pending' ? 'badge-warning' : 'badge-error'}`}>
              Your Status: {myRegistration.status}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {['info', 'players', isOwnTournament ? 'manage' : null].filter(Boolean).map((tab) => (
          <button key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.625rem 1.25rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Inter',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: activeTab === tab ? 'var(--primary-light)' : 'var(--text-muted)',
              borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
              transition: 'var(--transition)',
              textTransform: 'capitalize',
            }}
          >{tab === 'manage' ? '⚙️ Manage' : tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="grid-2" style={{ alignItems: 'start' }}>
          {/* Left: Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>📋 Tournament Info</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {[
                  { icon: <FiCalendar />, label: 'Dates', value: `${format(new Date(tournament.startDate), 'MMM d')} – ${format(new Date(tournament.endDate), 'MMM d, yyyy')}` },
                  { icon: <FiCalendar />, label: 'Reg. Deadline', value: format(new Date(tournament.registrationDeadline), 'MMM d, yyyy') },
                  { icon: <FiMapPin />, label: 'Venue', value: `${tournament.venue?.name}, ${tournament.venue?.city}` },
                  { icon: <FiUsers />, label: 'Players', value: `${tournament.registeredCount}/${tournament.maxParticipants}` },
                  { icon: '🏆', label: 'Format', value: tournament.format?.replace(/_/g, ' ') },
                  { icon: '🏸', label: 'Category', value: tournament.category?.replace(/_/g, ' ') },
                  { icon: '💰', label: 'Entry Fee', value: tournament.entryFee > 0 ? `₹${tournament.entryFee}` : 'Free' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
                    <span style={{ color: 'var(--primary-light)', display: 'flex', alignItems: 'center', minWidth: 16 }}>{item.icon}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', minWidth: 100 }}>{item.label}</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 500, textTransform: 'capitalize' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {tournament.description && (
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '0.75rem' }}>📝 Description</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.9rem' }}>{tournament.description}</p>
              </div>
            )}
          </div>

          {/* Right: Prize & Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(tournament.prizeMoney?.first > 0) && (
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>🏆 Prize Money</h3>
                {[
                  { label: '🥇 1st Place', amount: tournament.prizeMoney?.first },
                  { label: '🥈 2nd Place', amount: tournament.prizeMoney?.second },
                  { label: '🥉 3rd Place', amount: tournament.prizeMoney?.third },
                ].filter((p) => p.amount > 0).map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{p.label}</span>
                    <span style={{ color: 'var(--accent-light)', fontWeight: 700 }}>₹{p.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Progress */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>📊 Registration Progress</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Players registered</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{tournament.registeredCount}/{tournament.maxParticipants}</span>
              </div>
              <div style={{ height: 10, background: 'var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min((tournament.registeredCount / tournament.maxParticipants) * 100, 100)}%`,
                  background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                  borderRadius: 10, transition: 'width 0.5s ease',
                }} />
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                {tournament.maxParticipants - tournament.registeredCount} spots remaining
              </p>
            </div>

            {tournament.rules && (
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '0.75rem' }}>📜 Rules</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{tournament.rules}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'players' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Approved Players ({registrations.filter((r) => r.status === 'approved').length})</h3>
          {registrations.filter((r) => r.status === 'approved').length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No players approved yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {registrations.filter((r) => r.status === 'approved').map((reg, i) => (
                <div key={reg._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', minWidth: '24px' }}>#{i + 1}</span>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700 }}>
                    {reg.player?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{reg.player?.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{reg.player?.city}</div>
                  </div>
                  {reg.seed && <span className="badge badge-primary" style={{ marginLeft: 'auto' }}>Seed #{reg.seed}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'manage' && isOwnTournament && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>⚙️ Manage Registrations</h3>
            {registrations.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No registrations yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {registrations.map((reg) => (
                  <div key={reg._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <div style={{ fontWeight: 600 }}>{reg.player?.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{reg.player?.email} • {reg.player?.city}</div>
                    </div>
                    <span className={`badge ${reg.status === 'approved' ? 'badge-success' : reg.status === 'pending' ? 'badge-warning' : 'badge-error'}`}>
                      {reg.status}
                    </span>
                    {reg.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-sm" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}
                          onClick={() => handleApprove(reg._id)}>✓ Approve</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleReject(reg._id)}>✗ Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showEdit && <TournamentForm tournament={tournament} onClose={() => setShowEdit(false)} />}
    </div>
  );
}

export default TournamentDetailPage;
