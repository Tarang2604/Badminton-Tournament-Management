// routes/registrations.js — Player Tournament Registration Routes
const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Tournament = require('../models/Tournament');
const { protect, authorize } = require('../middleware/auth');

// ─── POST /api/registrations ──────────────────────────────────────────────────
// @desc    Register current player for a tournament
// @access  Private (Player)
router.post('/', protect, async (req, res) => {
  try {
    const { tournamentId, partnerId, notes } = req.body;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });

    // Check if registration is open
    if (!['registration_open'].includes(tournament.status)) {
      return res.status(400).json({ success: false, message: 'Tournament registration is not open' });
    }

    if (tournament.registeredCount >= tournament.maxParticipants) {
      return res.status(400).json({ success: false, message: 'Tournament is full' });
    }

    if (new Date() > tournament.registrationDeadline) {
      return res.status(400).json({ success: false, message: 'Registration deadline has passed' });
    }

    // Check for duplicate registration
    const existing = await Registration.findOne({ tournament: tournamentId, player: req.user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You are already registered for this tournament' });
    }

    // Determine payment requirement
    const paymentStatus = tournament.entryFee > 0 ? 'pending' : 'not_required';

    const registration = await Registration.create({
      tournament: tournamentId,
      player: req.user._id,
      partner: partnerId || null,
      notes,
      paymentStatus,
      paymentAmount: tournament.entryFee,
    });

    await registration.populate('tournament', 'name startDate venue status');
    await registration.populate('player', 'name email');

    res.status(201).json({ success: true, message: 'Registration submitted! Awaiting approval.', registration });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You are already registered for this tournament' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET /api/registrations/my ───────────────────────────────────────────────
// @desc    Get logged-in player's registrations
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    const registrations = await Registration.find({ player: req.user._id })
      .populate('tournament', 'name startDate endDate venue status format category coverImage')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: registrations.length, registrations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET /api/registrations/tournament/:tournamentId ─────────────────────────
// @desc    Get all registrations for a tournament (organizer/admin)
// @access  Private (Admin, Organizer)
router.get('/tournament/:tournamentId', protect, authorize('admin', 'organizer'), async (req, res) => {
  try {
    const { status } = req.query;
    const query = { tournament: req.params.tournamentId };
    if (status) query.status = status;

    const registrations = await Registration.find(query)
      .populate('player', 'name email city phone stats profilePicture')
      .populate('partner', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: registrations.length, registrations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── PATCH /api/registrations/:id/approve ────────────────────────────────────
// @desc    Approve a registration
// @access  Private (Admin, Organizer)
router.patch('/:id/approve', protect, authorize('admin', 'organizer'), async (req, res) => {
  try {
    const { seed } = req.body; // Optional seeding

    const registration = await Registration.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', seed: seed || null },
      { new: true }
    ).populate('player', 'name email');

    if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });

    // Increment tournament registered count
    await Tournament.findByIdAndUpdate(registration.tournament, { $inc: { registeredCount: 1 } });

    res.json({ success: true, message: 'Registration approved', registration });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── PATCH /api/registrations/:id/reject ─────────────────────────────────────
// @desc    Reject a registration
// @access  Private (Admin, Organizer)
router.patch('/:id/reject', protect, authorize('admin', 'organizer'), async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    const registration = await Registration.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason: rejectionReason || 'Not specified' },
      { new: true }
    ).populate('player', 'name email');

    if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });

    res.json({ success: true, message: 'Registration rejected', registration });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── PATCH /api/registrations/:id/withdraw ───────────────────────────────────
// @desc    Withdraw from a tournament (player's own registration)
// @access  Private
router.patch('/:id/withdraw', protect, async (req, res) => {
  try {
    const registration = await Registration.findOne({
      _id: req.params.id,
      player: req.user._id,
    });

    if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });

    if (['rejected', 'withdrawn'].includes(registration.status)) {
      return res.status(400).json({ success: false, message: 'Cannot withdraw from this registration' });
    }

    const wasApproved = registration.status === 'approved';
    registration.status = 'withdrawn';
    await registration.save();

    // Decrement count if was approved
    if (wasApproved) {
      await Tournament.findByIdAndUpdate(registration.tournament, { $inc: { registeredCount: -1 } });
    }

    res.json({ success: true, message: 'Registration withdrawn successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
