// src/pages/TournamentsPage.jsx — Tournament Listing with Search & Filters
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiSearch, FiFilter } from 'react-icons/fi';
import { fetchTournaments, selectTournaments, selectTournamentsLoading } from '../store/slices/tournamentSlice';
import { selectIsOrganizer } from '../store/slices/authSlice';
import TournamentCard from '../components/common/TournamentCard';
import TournamentForm from '../components/tournaments/TournamentForm';
import LoadingSpinner from '../components/common/LoadingSpinner';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'registration_open', label: 'Open' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Live' },
  { value: 'completed', label: 'Completed' },
];

const FORMAT_OPTIONS = [
  { value: '', label: 'All Formats' },
  { value: 'single_elimination', label: 'Single Elimination' },
  { value: 'double_elimination', label: 'Double Elimination' },
  { value: 'round_robin', label: 'Round Robin' },
];

function TournamentsPage() {
  const dispatch = useDispatch();
  const tournaments = useSelector(selectTournaments);
  const isLoading = useSelector(selectTournamentsLoading);
  const isOrganizer = useSelector(selectIsOrganizer);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [format, setFormat] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (status) params.status = status;
    if (format) params.format = format;
    dispatch(fetchTournaments(params));
  }, [dispatch, search, status, format]);

  return (
    <div className="container page-wrapper">
      {/* Header */}
      <div className="section-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem' }}>🏆 Tournaments</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {tournaments.length} tournament{tournaments.length !== 1 ? 's' : ''} found
          </p>
        </div>
        {isOrganizer && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Create Tournament
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <FiSearch style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search tournaments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
        <select className="form-select" style={{ width: 'auto', minWidth: '150px' }} value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className="form-select" style={{ width: 'auto', minWidth: '170px' }} value={format} onChange={(e) => setFormat(e.target.value)}>
          {FORMAT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Tournament Grid */}
      {isLoading ? (
        <LoadingSpinner text="Loading tournaments..." />
      ) : tournaments.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏸</div>
          <h3>No Tournaments Found</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {search || status || format ? 'Try adjusting your filters' : 'No tournaments have been created yet'}
          </p>
        </div>
      ) : (
        <div className="grid-3">
          {tournaments.map((tournament) => (
            <TournamentCard key={tournament._id} tournament={tournament} />
          ))}
        </div>
      )}

      {/* Create Tournament Modal */}
      {showForm && <TournamentForm onClose={() => setShowForm(false)} />}
    </div>
  );
}

export default TournamentsPage;
