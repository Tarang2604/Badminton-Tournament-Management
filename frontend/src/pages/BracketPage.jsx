// src/pages/BracketPage.jsx — Full Tournament Bracket View
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tournamentAPI, matchAPI } from '../services/api';
import { useSelector } from 'react-redux';
import { selectIsOrganizer } from '../store/slices/authSlice';
import BracketView from '../components/bracket/BracketView';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

function ScoreModal({ match, onClose, onSave }) {
  const [sets, setSets] = useState(
    match.sets?.length ? match.sets : [{ player1Score: 0, player2Score: 0 }]
  );

  const addSet = () => setSets([...sets, { player1Score: 0, player2Score: 0 }]);
  const removeSet = (i) => setSets(sets.filter((_, idx) => idx !== i));
  const updateSet = (i, field, val) => {
    const updated = [...sets];
    updated[i] = { ...updated[i], [field]: Number(val) };
    setSets(updated);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '420px' }}>
        <h3 style={{ marginBottom: '1rem' }}>📝 Enter Score</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span style={{ flex: 1 }}>{match.player1?.name || 'Player 1'}</span>
          <span style={{ width: 30, textAlign: 'center' }}>vs</span>
          <span style={{ flex: 1, textAlign: 'right' }}>{match.player2?.name || 'Player 2'}</span>
        </div>
        {sets.map((set, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', width: '50px' }}>Set {i + 1}</span>
            <input type="number" min="0" max="99" value={set.player1Score} onChange={(e) => updateSet(i, 'player1Score', e.target.value)}
              className="form-input" style={{ width: '70px', textAlign: 'center', padding: '0.5rem' }} />
            <span style={{ color: 'var(--text-muted)' }}>–</span>
            <input type="number" min="0" max="99" value={set.player2Score} onChange={(e) => updateSet(i, 'player2Score', e.target.value)}
              className="form-input" style={{ width: '70px', textAlign: 'center', padding: '0.5rem' }} />
            {sets.length > 1 && <button onClick={() => removeSet(i)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>×</button>}
          </div>
        ))}
        {sets.length < 3 && (
          <button className="btn btn-ghost btn-sm" onClick={addSet} style={{ marginBottom: '1rem' }}>+ Add Set</button>
        )}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(sets)}>Save Score</button>
        </div>
      </div>
    </div>
  );
}

function BracketPage() {
  const { id } = useParams();
  const isOrganizer = useSelector(selectIsOrganizer);

  const [tournament, setTournament] = useState(null);
  const [bracket, setBracket] = useState({});
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);

  const loadBracket = async () => {
    try {
      const [tRes, bRes] = await Promise.all([
        tournamentAPI.getById(id),
        tournamentAPI.getBracket(id),
      ]);
      setTournament(tRes.data.tournament);
      setBracket(bRes.data.bracket || {});
      setMatches(bRes.data.matches || []);
    } catch (err) {
      toast.error('Failed to load bracket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBracket(); }, [id]);

  const handleSaveScore = async (sets) => {
    try {
      await matchAPI.updateScore(selectedMatch._id, { sets });
      toast.success('Score updated!');
      setSelectedMatch(null);
      await loadBracket();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update score');
    }
  };

  if (loading) return <LoadingSpinner text="Loading bracket..." />;

  return (
    <div className="container page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link to={`/tournaments/${id}`} style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>← Back to Tournament</Link>
          <h1 style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>🏆 {tournament?.name}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Tournament Bracket</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span className="badge badge-gray">{matches.length} matches</span>
          <span className="badge badge-success">{matches.filter((m) => m.status === 'completed').length} completed</span>
        </div>
      </div>

      {/* Bracket */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <BracketView bracket={bracket} matches={matches} />
      </div>

      {/* Matches List (for score entry by organizer) */}
      {isOrganizer && matches.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>⚙️ Score Entry</h2>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Round</th><th>Match</th><th>Player 1</th><th>Player 2</th><th>Score</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {matches.filter((m) => m.player1 && m.player2 && m.status !== 'bye').map((match) => (
                  <tr key={match._id}>
                    <td style={{ color: 'var(--text-muted)' }}>{match.roundName}</td>
                    <td>#{match.matchNumber}</td>
                    <td style={{ fontWeight: match.winner?._id === match.player1?._id ? 600 : 400, color: match.winner?._id === match.player1?._id ? '#34d399' : 'inherit' }}>
                      {match.player1?.name}
                    </td>
                    <td style={{ fontWeight: match.winner?._id === match.player2?._id ? 600 : 400, color: match.winner?._id === match.player2?._id ? '#34d399' : 'inherit' }}>
                      {match.player2?.name}
                    </td>
                    <td>
                      {match.sets?.map((s, i) => (
                        <span key={i} style={{ fontSize: '0.8rem', marginRight: '0.375rem' }}>{s.player1Score}-{s.player2Score}</span>
                      ))}
                    </td>
                    <td><span className={`badge ${match.status === 'completed' ? 'badge-success' : match.status === 'in_progress' ? 'badge-warning' : 'badge-gray'}`}>{match.status}</span></td>
                    <td>
                      {match.status !== 'completed' && (
                        <button className="btn btn-sm btn-primary" onClick={() => setSelectedMatch(match)}>Enter Score</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedMatch && (
        <ScoreModal match={selectedMatch} onClose={() => setSelectedMatch(null)} onSave={handleSaveScore} />
      )}
    </div>
  );
}

export default BracketPage;
