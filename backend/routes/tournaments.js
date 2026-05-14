// routes/tournaments.js — Tournament CRUD Routes
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Tournament = require('../models/Tournament');
const Registration = require('../models/Registration');
const Match = require('../models/Match');
const { protect, authorize } = require('../middleware/auth');
const { generateSingleElimination, generateRoundRobin } = require('../utils/bracketGenerator');

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  return null;
};

// ─── GET /api/tournaments ─────────────────────────────────────────────────────
// @desc    Get all tournaments (with filters/search/pagination)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { status, format, category, search, page = 1, limit = 12 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (format) query.format = format;
    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };

    const total = await Tournament.countDocuments(query);
    const tournaments = await Tournament.find(query)
      .populate('organizer', 'name email')
      .populate('winner', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: tournaments.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      tournaments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET /api/tournaments/stats ───────────────────────────────────────────────
// @desc    Get dashboard stats (admin/organizer)
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const [totalTournaments, ongoing, upcoming, completed, totalRegistrations] = await Promise.all([
      Tournament.countDocuments(),
      Tournament.countDocuments({ status: 'ongoing' }),
      Tournament.countDocuments({ status: { $in: ['upcoming', 'registration_open'] } }),
      Tournament.countDocuments({ status: 'completed' }),
      Registration.countDocuments({ status: 'approved' }),
    ]);

    res.json({
      success: true,
      stats: { totalTournaments, ongoing, upcoming, completed, totalRegistrations },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET /api/tournaments/:id ─────────────────────────────────────────────────
// @desc    Get single tournament by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('organizer', 'name email phone')
      .populate('winner', 'name city')
      .populate('runnerUp', 'name city')
      .populate('seedings.player', 'name city');

    if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });

    res.json({ success: true, tournament });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── POST /api/tournaments ────────────────────────────────────────────────────
// @desc    Create new tournament
// @access  Private (Admin, Organizer)
router.post(
  '/',
  protect,
  authorize('admin', 'organizer'),
  [
    body('name').trim().notEmpty().withMessage('Tournament name is required'),
    body('format').isIn(['single_elimination', 'double_elimination', 'round_robin']).withMessage('Invalid format'),
    body('category').isIn(['mens_singles', 'womens_singles', 'mens_doubles', 'womens_doubles', 'mixed_doubles']).withMessage('Invalid category'),
    body('startDate').isISO8601().withMessage('Valid start date required'),
    body('endDate').isISO8601().withMessage('Valid end date required'),
    body('registrationDeadline').isISO8601().withMessage('Valid registration deadline required'),
    body('maxParticipants').isInt({ min: 2, max: 256 }).withMessage('Max participants must be 2-256'),
    body('venue.name').notEmpty().withMessage('Venue name required'),
    body('venue.city').notEmpty().withMessage('Venue city required'),
  ],
  async (req, res) => {
    const errRes = handleValidation(req, res);
    if (errRes) return errRes;

    try {
      const tournament = await Tournament.create({
        ...req.body,
        organizer: req.user._id,
        status: 'registration_open', // Auto-open registration on creation
      });

      res.status(201).json({ success: true, message: 'Tournament created successfully', tournament });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// ─── PUT /api/tournaments/:id ─────────────────────────────────────────────────
// @desc    Update tournament
// @access  Private (Admin, or organizer who created it)
router.put('/:id', protect, authorize('admin', 'organizer'), async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });

    // Organizers can only edit their own tournaments
    if (req.user.role === 'organizer' && tournament.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this tournament' });
    }

    const updated = await Tournament.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, message: 'Tournament updated', tournament: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── PATCH /api/tournaments/:id/status ───────────────────────────────────────
// @desc    Change tournament status
// @access  Private (Admin, Organizer)
router.patch('/:id/status', protect, authorize('admin', 'organizer'), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['upcoming', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const tournament = await Tournament.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });

    res.json({ success: true, message: `Tournament status updated to ${status}`, tournament });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── POST /api/tournaments/:id/generate-bracket ──────────────────────────────
// @desc    Generate bracket/draw from approved registrations
// @access  Private (Admin, Organizer)
router.post('/:id/generate-bracket', protect, authorize('admin', 'organizer'), async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });

    // Get approved registrations
    const registrations = await Registration.find({
      tournament: req.params.id,
      status: 'approved',
    }).populate('player', 'name');

    if (registrations.length < 2) {
      return res.status(400).json({ success: false, message: 'Need at least 2 approved players to generate bracket' });
    }

    // Build players array with seed info
    const players = registrations.map((r) => ({
      _id: r.player._id,
      name: r.player.name,
      seed: r.seed,
    }));

    // Delete any existing matches for this tournament
    await Match.deleteMany({ tournament: req.params.id });

    // Generate based on format
    let matchData = [];
    if (tournament.format === 'round_robin') {
      matchData = generateRoundRobin(players, req.params.id);
    } else {
      matchData = generateSingleElimination(players, req.params.id);
    }

    // Save matches to DB
    const matches = await Match.insertMany(matchData);

    // Update tournament status and registration count
    await Tournament.findByIdAndUpdate(req.params.id, {
      status: 'ongoing',
      registeredCount: registrations.length,
    });

    res.json({
      success: true,
      message: `Bracket generated with ${matches.length} matches`,
      matchCount: matches.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET /api/tournaments/:id/bracket ────────────────────────────────────────
// @desc    Get all matches for a tournament (bracket view)
// @access  Public
router.get('/:id/bracket', async (req, res) => {
  try {
    const matches = await Match.find({ tournament: req.params.id })
      .populate('player1', 'name city profilePicture')
      .populate('player2', 'name city profilePicture')
      .populate('winner', 'name')
      .sort({ round: 1, matchNumber: 1 });

    // Group by round for easy bracket rendering
    const bracket = {};
    matches.forEach((match) => {
      if (!bracket[match.round]) bracket[match.round] = [];
      bracket[match.round].push(match);
    });

    res.json({ success: true, matches, bracket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── DELETE /api/tournaments/:id ─────────────────────────────────────────────
// @desc    Delete tournament (admin only)
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const tournament = await Tournament.findByIdAndDelete(req.params.id);
    if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });

    // Cascade delete related matches and registrations
    await Promise.all([
      Match.deleteMany({ tournament: req.params.id }),
      Registration.deleteMany({ tournament: req.params.id }),
    ]);

    res.json({ success: true, message: 'Tournament and all related data deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
