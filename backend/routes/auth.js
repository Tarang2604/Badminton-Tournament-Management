// routes/auth.js — Authentication Routes (Register / Login / Me)
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { protect } = require('../middleware/auth');

// ─── Helper: Send validation errors ──────────────────────────────────────────
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  return null;
};

// ─── POST /api/auth/register ──────────────────────────────────────────────────
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['player', 'organizer']).withMessage('Invalid role'),
  ],
  async (req, res) => {
    const errRes = handleValidationErrors(req, res);
    if (errRes) return errRes;

    try {
      const { name, email, password, role = 'player', phone, city } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }

      // Create user (password hashed by pre-save hook)
      const user = await User.create({ name, email, password, role, phone, city });

      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        token,
        user: {
          _id:   user._id,
          name:  user.name,
          email: user.email,
          role:  user.role,
          stats: user.stats,
          city:  user.city,
          phone: user.phone,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error('Register error:', error.message);
      res.status(500).json({ success: false, message: 'Server error during registration' });
    }
  }
);

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
// @desc    Login and get JWT token
// @access  Public
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errRes = handleValidationErrors(req, res);
    if (errRes) return errRes;

    try {
      const { email, password } = req.body;

      // Find user and include password field for comparison
      const user = await User.findOne({ email }).select('+password');

      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      if (!user.isActive) {
        return res.status(401).json({ success: false, message: 'Account is deactivated. Contact admin.' });
      }

      const token = generateToken(user._id);

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          _id:   user._id,
          name:  user.name,
          email: user.email,
          role:  user.role,
          stats: user.stats,
          city:  user.city,
          phone: user.phone,
          profilePicture: user.profilePicture,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error('Login error:', error.message);
      res.status(500).json({ success: false, message: 'Server error during login' });
    }
  }
);

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
// @desc    Get currently logged-in user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── PUT /api/auth/update-profile ────────────────────────────────────────────
// @desc    Update profile info
// @access  Private
router.put(
  '/update-profile',
  protect,
  [
    body('name').optional().trim().isLength({ max: 50 }),
    body('phone').optional().trim(),
    body('city').optional().trim(),
  ],
  async (req, res) => {
    const errRes = handleValidationErrors(req, res);
    if (errRes) return errRes;

    try {
      const { name, phone, city, profilePicture } = req.body;

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { name, phone, city, profilePicture },
        { new: true, runValidators: true }
      );

      res.json({ success: true, message: 'Profile updated', user });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// ─── PUT /api/auth/change-password ───────────────────────────────────────────
// @desc    Change password
// @access  Private
router.put(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errRes = handleValidationErrors(req, res);
    if (errRes) return errRes;

    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(req.user._id).select('+password');
      if (!(await user.matchPassword(currentPassword))) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }

      user.password = newPassword; // Will be hashed by pre-save hook
      await user.save();

      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

module.exports = router;
