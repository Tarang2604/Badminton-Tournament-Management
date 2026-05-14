// models/Tournament.js — Tournament Schema
const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tournament name is required'],
      trim: true,
      maxlength: [100, 'Tournament name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Tournament format
    format: {
      type: String,
      enum: ['single_elimination', 'double_elimination', 'round_robin'],
      required: [true, 'Tournament format is required'],
    },
    category: {
      type: String,
      enum: ['mens_singles', 'womens_singles', 'mens_doubles', 'womens_doubles', 'mixed_doubles'],
      required: [true, 'Category is required'],
    },
    // Dates
    registrationDeadline: {
      type: Date,
      required: [true, 'Registration deadline is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    // Venue
    venue: {
      name:    { type: String, required: true },
      address: { type: String, default: '' },
      city:    { type: String, required: true },
      state:   { type: String, default: '' },
    },
    // Capacity
    maxParticipants: {
      type: Number,
      required: [true, 'Max participants is required'],
      min: [2, 'Minimum 2 participants'],
      max: [256, 'Maximum 256 participants'],
    },
    registeredCount: {
      type: Number,
      default: 0,
    },
    // Prize money / entry fee
    entryFee: {
      type: Number,
      default: 0,
    },
    prizeMoney: {
      first:  { type: Number, default: 0 },
      second: { type: Number, default: 0 },
      third:  { type: Number, default: 0 },
    },
    // Status lifecycle
    status: {
      type: String,
      enum: ['upcoming', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    // Winners (populated after tournament completion)
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    runnerUp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Seeding — list of players in seed order
    seedings: [
      {
        player: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        seed:   { type: Number },
      },
    ],
    // Cover image URL
    coverImage: {
      type: String,
      default: '',
    },
    rules: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: Is registration open ───────────────────────────────────────────
tournamentSchema.virtual('isRegistrationOpen').get(function () {
  return (
    this.status === 'registration_open' &&
    new Date() < this.registrationDeadline &&
    this.registeredCount < this.maxParticipants
  );
});

// ─── Virtual: Slots remaining ─────────────────────────────────────────────────
tournamentSchema.virtual('slotsRemaining').get(function () {
  return this.maxParticipants - this.registeredCount;
});

// ─── Indexes for fast lookups ──────────────────────────────────────────────────
tournamentSchema.index({ status: 1 });
tournamentSchema.index({ startDate: -1 });
tournamentSchema.index({ organizer: 1 });

module.exports = mongoose.model('Tournament', tournamentSchema);
