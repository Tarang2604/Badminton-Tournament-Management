// src/components/bracket/BracketView.jsx — Visual Tournament Bracket
import './BracketView.css';

function MatchCard({ match, roundIndex }) {
  const getScoreDisplay = () => {
    if (!match.sets || match.sets.length === 0) return null;
    return match.sets.map((set, i) => (
      <span key={i} style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
        {set.player1Score}-{set.player2Score}
        {i < match.sets.length - 1 ? ', ' : ''}
      </span>
    ));
  };

  const isWinner = (player) => match.winner && player?._id === match.winner?._id;

  return (
    <div className={`bracket-match ${match.status}`}>
      <div className={`bracket-player ${isWinner(match.player1) ? 'winner' : ''} ${!match.player1 ? 'tbd' : ''}`}>
        <span className="player-name">{match.player1?.name || 'TBD'}</span>
        <span className="player-sets">{match.player1SetsWon ?? ''}</span>
      </div>
      <div className="match-divider">
        {getScoreDisplay() && <div className="sets-display">{getScoreDisplay()}</div>}
        {match.status === 'completed' && <div className="vs-line" />}
        {match.status === 'in_progress' && <div className="live-dot" />}
        {match.status === 'scheduled' && <div className="vs-text">vs</div>}
      </div>
      <div className={`bracket-player ${isWinner(match.player2) ? 'winner' : ''} ${!match.player2 ? 'tbd' : ''}`}>
        <span className="player-name">{match.player2?.name || 'TBD'}</span>
        <span className="player-sets">{match.player2SetsWon ?? ''}</span>
      </div>
      {match.roundName && (
        <div className="match-label">{match.roundName} • #{match.matchNumber}</div>
      )}
    </div>
  );
}

function BracketView({ bracket, matches }) {
  // bracket = { 1: [...matches], 2: [...matches], ... }
  const rounds = Object.keys(bracket).map(Number).sort((a, b) => a - b);

  if (!rounds.length) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏸</div>
        <h3>Bracket Not Generated Yet</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          The organizer will generate the bracket after registration closes.
        </p>
      </div>
    );
  }

  return (
    <div className="bracket-container">
      <div className="bracket-scroll">
        {rounds.map((round) => (
          <div key={round} className="bracket-round">
            <div className="round-header">
              <span>{bracket[round][0]?.roundName || `Round ${round}`}</span>
            </div>
            <div className="round-matches">
              {bracket[round].map((match) => (
                <MatchCard key={match._id} match={match} roundIndex={round} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BracketView;
