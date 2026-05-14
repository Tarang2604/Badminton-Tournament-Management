// models/Registration.js — Player Tournament Registration Schema
const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
    },
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // For doubles — partner reference
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Approval workflow
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'withdrawn'],
      default: 'pending',
    },
    // Seeding assigned by organizer/admin
    seed: {
      type: Number,
      default: null,
    },
    // Payment status (if entry fee > 0)
    paymentStatus: {
      type: String,
      enum: ['not_required', 'pending', 'paid', 'refunded'],
      default: 'not_required',
    },
    paymentAmount: {
      type: Number,
      default: 0,
    },
    // Rejection reason (if rejected)
    rejectionReason: {
      type: String,
      default: '',
    },
    // Notes from player
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// ─── Compound unique index — one registration per player per tournament ────────
registrationSchema.index({ tournament: 1, player: 1 }, { unique: true });
registrationSchema.index({ tournament: 1, status: 1 });

module.exports = mongoose.model('Registration', registrationSchema);
