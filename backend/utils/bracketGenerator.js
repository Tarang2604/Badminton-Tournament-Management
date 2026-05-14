// utils/bracketGenerator.js — Automatic Bracket/Draw Generation
/**
 * Generates a single-elimination bracket for a list of players.
 * - Seeds players (1 vs last, 2 vs second-last, etc.)
 * - Handles byes for non-power-of-2 player counts
 * - Returns an array of match objects ready to save to MongoDB
 *
 * @param {Array} players - Array of registered player objects [{_id, name, seed}]
 * @param {string} tournamentId - MongoDB Tournament ID
 * @returns {Array} matches - Array of match data to insert
 */
const generateSingleElimination = (players, tournamentId) => {
  const n = players.length;

  // Find next power of 2 >= n (bracket size)
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(n)));
  const totalRounds = Math.log2(bracketSize);

  // Sort by seed (seeded players first, unseeded last)
  const seededPlayers = [...players].sort((a, b) => {
    if (a.seed && b.seed) return a.seed - b.seed;
    if (a.seed) return -1;
    if (b.seed) return 1;
    return 0;
  });

  // Fill with null (byes) to reach bracketSize
  while (seededPlayers.length < bracketSize) {
    seededPlayers.push(null);
  }

  // Classic bracket seeding: 1 vs bracketSize, 2 vs bracketSize-1, etc.
  const positions = createBracketSeeding(bracketSize);
  const firstRoundPlayers = positions.map((pos) => seededPlayers[pos - 1] || null);

  const matches = [];
  let matchNumber = 1;

  // ─── Round 1: Build initial matches ──────────────────────────────────────────
  for (let i = 0; i < bracketSize; i += 2) {
    const p1 = firstRoundPlayers[i];
    const p2 = firstRoundPlayers[i + 1];

    const isBye = !p1 || !p2;

    matches.push({
      tournament: tournamentId,
      round: 1,
      roundName: getRoundName(1, totalRounds),
      matchNumber: matchNumber++,
      player1: p1 ? p1._id : null,
      player2: p2 ? p2._id : null,
      status: isBye ? 'bye' : 'scheduled',
      // Winner of a bye is auto-set to the present player
      winner: isBye ? (p1 ? p1._id : p2 ? p2._id : null) : null,
    });
  }

  // ─── Subsequent rounds: placeholder matches ───────────────────────────────
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round);
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        tournament: tournamentId,
        round,
        roundName: getRoundName(round, totalRounds),
        matchNumber: matchNumber++,
        player1: null,
        player2: null,
        status: 'scheduled',
        winner: null,
      });
    }
  }

  return matches;
};

/**
 * Generates a round-robin schedule where every player plays every other player.
 * Uses the "circle method" for optimal scheduling.
 */
const generateRoundRobin = (players, tournamentId) => {
  const n = players.length;
  const matches = [];
  let matchNumber = 1;

  // Round-robin using circle algorithm
  const playerList = [...players];
  if (n % 2 !== 0) playerList.push(null); // Add dummy for odd number

  const rounds = playerList.length - 1;
  const half = playerList.length / 2;

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < half; i++) {
      const p1 = playerList[i];
      const p2 = playerList[playerList.length - 1 - i];

      if (p1 && p2) {
        matches.push({
          tournament: tournamentId,
          round: round + 1,
          roundName: `Round ${round + 1}`,
          matchNumber: matchNumber++,
          player1: p1._id,
          player2: p2._id,
          status: 'scheduled',
          winner: null,
        });
      }
    }

    // Rotate players (keep index 0 fixed)
    playerList.splice(1, 0, playerList.pop());
  }

  return matches;
};

// ─── Helper: Human-readable round names ──────────────────────────────────────
const getRoundName = (round, totalRounds) => {
  const roundsFromFinal = totalRounds - round;
  if (roundsFromFinal === 0) return 'Final';
  if (roundsFromFinal === 1) return 'Semi-Final';
  if (roundsFromFinal === 2) return 'Quarter-Final';
  return `Round of ${Math.pow(2, roundsFromFinal + 1)}`;
};

// ─── Helper: Standard bracket seeding positions ───────────────────────────────
const createBracketSeeding = (size) => {
  if (size === 1) return [1];
  const half = size / 2;
  const result = [];
  const prev = createBracketSeeding(half);
  for (const p of prev) {
    result.push(p);
    result.push(size + 1 - p);
  }
  return result;
};

module.exports = { generateSingleElimination, generateRoundRobin };
