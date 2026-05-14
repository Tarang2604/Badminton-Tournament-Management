// routes/matches.js — Match Score & Result Management
const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const Tournament = require('../models/Tournament');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// ─── GET /api/matches/tournament/:tournamentId ────────────────────────────────
// @desc    Get all matches for a tournament
// @access  Public
router.get('/tournament/:tournamentId', async (req, res) => {
  try {
    const matches = await Match.find({ tournament: req.params.tournamentId })
      .populate('player1', 'name city profilePicture')
      .populate('player2', 'name city profilePicture')
      .populate('winner', 'name')
      .sort({ round: 1, matchNumber: 1 });

    res.json({ success: true, count: matches.length, matches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET /api/matches/player/:playerId ───────────────────────────────────────
// @desc    Get all matches for a specific player
// @access  Public
router.get('/player/:playerId', async (req, res) => {
  try {
    const matches = await Match.find({
      $or: [{ player1: req.params.playerId }, { player2: req.params.playerId }],
    })
      .populate('tournament', 'name status startDate venue')
      .populate('player1', 'name city')
      .populate('player2', 'name city')
      .populate('winner', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: matches.length, matches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET /api/matches/:id ─────────────────────────────────────────────────────
// @desc    Get single match details
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('tournament', 'name format status venue')
      .populate('player1', 'name city profilePicture stats')
      .populate('player2', 'name city profilePicture stats')
      .populate('winner', 'name');

    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    res.json({ success: true, match });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── PUT /api/matches/:id/score ───────────────────────────────────────────────
// @desc    Update match score and declare winner (set-by-set)
// @access  Private (Admin, Organizer)
router.put('/:id/score', protect, authorize('admin', 'organizer'), async (req, res) => {
  try {
    const { sets, status } = req.body;
    // sets = [{player1Score: 21, player2Score: 15}, ...]

    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    // Count sets won
    let p1Sets = 0, p2Sets = 0;
    sets.forEach((set) => {
      if (set.player1Score > set.player2Score) p1Sets++;
      else if (set.player2Score > set.player1Score) p2Sets++;
    });

    // Determine winner (best of 3)
    let winner = null, loser = null;
    if (p1Sets >= 2) {
      winner = match.player1;
      loser = match.player2;
    } else if (p2Sets >= 2) {
      winner = match.player2;
      loser = match.player1;
    }

    // Update match
    const updatedMatch = await Match.findByIdAndUpdate(
      req.params.id,
      {
        sets,
        player1SetsWon: p1Sets,
        player2SetsWon: p2Sets,
        winner,
        loser,
        status: winner ? 'completed' : (status || 'in_progress'),
        completedAt: winner ? new Date() : null,
      },
      { new: true }
    )
      .populate('player1', 'name')
      .populate('player2', 'name')
      .populate('winner', 'name');

    // If match completed and there's a winner, advance them to next round
    if (winner && updatedMatch.nextMatchId) {
      const nextMatch = await Match.findById(updatedMatch.nextMatchId);
      if (nextMatch) {
        // Fill the next available slot (player1 first, then player2)
        const updateField = nextMatch.player1 ? 'player2' : 'player1';
        await Match.findByIdAndUpdate(updatedMatch.nextMatchId, { [updateField]: winner });
      }
    }

    // Update player stats if completed
    if (winner) {
      await Promise.all([
        User.findByIdAndUpdate(winner, {
          $inc: { 'stats.matchesPlayed': 1, 'stats.matchesWon': 1 },
        }),
        loser && User.findByIdAndUpdate(loser, {
          $inc: { 'stats.matchesPlayed': 1, 'stats.matchesLost': 1 },
        }),
      ]);

      // Recalculate win rate
      const winnerUser = await User.findById(winner);
      if (winnerUser) {
        winnerUser.updateWinRate();
        await winnerUser.save();
      }
    }

    res.json({ success: true, message: 'Score updated', match: updatedMatch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── PATCH /api/matches/:id/schedule ─────────────────────────────────────────
// @desc    Schedule a match (set date, court)
// @access  Private (Admin, Organizer)
router.patch('/:id/schedule', protect, authorize('admin', 'organizer'), async (req, res) => {
  try {
    const { scheduledAt, courtNumber, notes } = req.body;

    const match = await Match.findByIdAndUpdate(
      req.params.id,
      { scheduledAt, courtNumber, notes },
      { new: true }
    )
      .populate('player1', 'name')
      .populate('player2', 'name');

    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    res.json({ success: true, message: 'Match scheduled', match });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── PATCH /api/matches/:id/walkover ─────────────────────────────────────────
// @desc    Declare walkover (opponent forfeited)
// @access  Private (Admin, Organizer)
router.patch('/:id/walkover', protect, authorize('admin', 'organizer'), async (req, res) => {
  try {
    const { winnerId } = req.body;
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    const winner = winnerId === match.player1?.toString() ? match.player1 : match.player2;
    const loser  = winnerId === match.player1?.toString() ? match.player2 : match.player1;

    await Match.findByIdAndUpdate(req.params.id, {
      winner,
      loser,
      status: 'walkover',
      completedAt: new Date(),
    });

    res.json({ success: true, message: 'Walkover declared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
