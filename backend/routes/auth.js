const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Generate JWT token helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'watertank_secret_key_2026', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'Please enter all fields' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();

    // Check if user exists by email
    const emailExists = await User.findOne({ email: normalizedEmail });
    if (emailExists) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    // Check if user exists by username
    const usernameExists = await User.findOne({ username: { $regex: new RegExp(`^${normalizedUsername}$`, 'i') } });
    if (usernameExists) {
      return res.status(400).json({ success: false, error: 'Username already taken' });
    }

    // Create user
    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password,
      provider: 'local',
    });

    if (user) {
      res.status(201).json({
        success: true,
        token: generateToken(user._id),
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          provider: user.provider,
        },
      });
    } else {
      res.status(400).json({ success: false, error: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Signup API error:', error.message);
    res.status(500).json({ success: false, error: 'Server error during signup' });
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Please enter all fields' });
    }

    const identifier = username.trim().toLowerCase();

    // Find user by email or username (case insensitive)
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { username: { $regex: new RegExp(`^${username.trim()}$`, 'i') } }
      ]
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid username or password' });
    }

    // Verify provider is local (cannot login using password for Google accounts)
    if (user.provider !== 'local') {
      return res.status(400).json({
        success: false,
        error: 'This account uses Google login. Please sign in with Google.',
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Invalid username or password' });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        provider: user.provider,
      },
    });
  } catch (error) {
    console.error('Login API error:', error.message);
    res.status(500).json({ success: false, error: 'Server error during login' });
  }
});

// @desc    Simulate Google Login & Register
// @route   POST /api/auth/google
// @access  Public
router.post('/google', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({ success: false, error: 'Email and name are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Auto-register google user
      // Resolve unique username
      let baseUsername = name.trim().replace(/\s+/g, '').toLowerCase();
      let uniqueUsername = baseUsername;
      let counter = 1;
      
      while (await User.findOne({ username: { $regex: new RegExp(`^${uniqueUsername}$`, 'i') } })) {
        uniqueUsername = `${baseUsername}${counter}`;
        counter++;
      }

      user = await User.create({
        username: uniqueUsername,
        email: normalizedEmail,
        provider: 'google',
      });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        provider: user.provider,
      },
    });
  } catch (error) {
    console.error('Google Auth API error:', error.message);
    res.status(500).json({ success: false, error: 'Server error during Google auth' });
  }
});

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        provider: req.user.provider,
      },
    });
  } catch (error) {
    console.error('Validate User API error:', error.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
