// models/Match.js — Match/Game Schema
const mongoose = require('mongoose');

const setSchema = new mongoose.Schema(
  {
    player1Score: { type: Number, default: 0 },
    player2Score: { type: Number, default: 0 },
  },
  { _id: false }
);

const matchSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
      index: true,
    },
    // Round info: 1 = Quarter-Final, 2 = Semi-Final, etc.
    round: {
      type: Number,
      required: true,
    },
    roundName: {
      type: String,
      default: '', // e.g., "Quarter-Final", "Semi-Final", "Final"
    },
    matchNumber: {
      type: Number,
      required: true, // Position in the bracket
    },
    // Players (null = TBD / bye)
    player1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    player2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Set-by-set scores (badminton: best of 3 sets to 21)
    sets: {
      type: [setSchema],
      default: [],
    },
    // Computed totals
    player1SetsWon: { type: Number, default: 0 },
    player2SetsWon: { type: Number, default: 0 },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    loser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Match status
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'walkover', 'bye'],
      default: 'scheduled',
    },
    // Scheduling
    scheduledAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    courtNumber: {
      type: String,
      default: '',
    },
    // Which match does the winner advance to
    nextMatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      default: null,
    },
    // For double elimination — loser bracket
    nextLoserMatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// ─── Compound index for fast bracket lookups ───────────────────────────────────
matchSchema.index({ tournament: 1, round: 1, matchNumber: 1 });

module.exports = mongoose.model('Match', matchSchema);
