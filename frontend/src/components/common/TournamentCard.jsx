// src/components/common/TournamentCard.jsx
import { Link } from 'react-router-dom';
import { FiCalendar, FiMapPin, FiUsers, FiAward } from 'react-icons/fi';
import { format } from 'date-fns';

// ─── Status Badge Colors ──────────────────────────────────────────────────────
const statusColors = {
  upcoming:             'badge-info',
  registration_open:   'badge-success',
  registration_closed: 'badge-warning',
  ongoing:             'badge-primary',
  completed:           'badge-gray',
  cancelled:           'badge-error',
};

const statusLabels = {
  upcoming:             'Upcoming',
  registration_open:   'Open',
  registration_closed: 'Closed',
  ongoing:             'Live 🔴',
  completed:           'Completed',
  cancelled:           'Cancelled',
};

const formatLabels = {
  single_elimination: 'Single Elim.',
  double_elimination: 'Double Elim.',
  round_robin:        'Round Robin',
};

const categoryLabels = {
  mens_singles:    "Men's Singles",
  womens_singles:  "Women's Singles",
  mens_doubles:    "Men's Doubles",
  womens_doubles:  "Women's Doubles",
  mixed_doubles:   'Mixed Doubles',
};

function TournamentCard({ tournament }) {
  const {
    _id, name, status, format, category, startDate, endDate,
    venue, maxParticipants, registeredCount, entryFee, prizeMoney,
  } = tournament;

  return (
    <Link to={`/tournaments/${_id}`} style={{ textDecoration: 'none' }}>
      <div className="glass-card" style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.25rem', flexShrink: 0,
          }}>🏸</div>
          <span className={`badge ${statusColors[status] || 'badge-gray'}`}>
            {statusLabels[status] || status}
          </span>
        </div>

        {/* Tournament Name */}
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.375rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
          {name}
        </h3>

        {/* Tags */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{formatLabels[format]}</span>
          <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>{categoryLabels[category]}</span>
        </div>

        {/* Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiCalendar size={13} color="var(--primary-light)" />
            <span>{format(new Date(startDate), 'MMM d')} – {format(new Date(endDate), 'MMM d, yyyy')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiMapPin size={13} color="var(--primary-light)" />
            <span>{venue?.name}, {venue?.city}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiUsers size={13} color="var(--primary-light)" />
            <span>{registeredCount}/{maxParticipants} players</span>
            {/* Progress bar */}
            <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min((registeredCount / maxParticipants) * 100, 100)}%`,
                background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                borderRadius: 4,
              }} />
            </div>
          </div>
          {prizeMoney?.first > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiAward size={13} color="var(--accent)" />
              <span style={{ color: 'var(--accent-light)' }}>₹{prizeMoney.first.toLocaleString()} Prize</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {entryFee > 0 ? `Entry: ₹${entryFee}` : 'Free Entry'}
          </span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--primary-light)', fontWeight: 500 }}>
            View Details →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default TournamentCard;
