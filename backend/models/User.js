// models/User.js — User Schema (Player / Organizer / Admin)
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Never return password in queries by default
    },
    role: {
      type: String,
      enum: ['player', 'organizer', 'admin'],
      default: 'player',
    },
    // Player profile fields
    profilePicture: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    // Player stats (updated after each tournament)
    stats: {
      matchesPlayed: { type: Number, default: 0 },
      matchesWon:    { type: Number, default: 0 },
      matchesLost:   { type: Number, default: 0 },
      tournamentsPlayed: { type: Number, default: 0 },
      tournamentsWon:    { type: Number, default: 0 },
      winRate: { type: Number, default: 0 },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// ─── Pre-save Hook: Hash password before saving ───────────────────────────────
userSchema.pre('save', async function (next) {
  // Only hash if password was modified (not on other save calls)
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance Method: Compare entered password with hashed ────────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ─── Virtual: Win rate calculation ────────────────────────────────────────────
userSchema.methods.updateWinRate = function () {
  if (this.stats.matchesPlayed > 0) {
    this.stats.winRate = Math.round((this.stats.matchesWon / this.stats.matchesPlayed) * 100);
  }
};

module.exports = mongoose.model('User', userSchema);
