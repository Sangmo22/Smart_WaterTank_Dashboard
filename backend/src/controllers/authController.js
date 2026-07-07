const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// Validation Schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format').trim(),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().min(2, 'Name must be at least 2 characters long').trim()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format').trim(),
  password: z.string().min(1, 'Password is required')
});

// Helper: Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret_key_change_me_in_production', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    const normalizedEmail = email.toLowerCase();

    // Check duplicate
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return next(new ErrorResponse('Email already registered', 400, 'RESOURCE_ALREADY_EXISTS'));
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
      name
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return next(new ErrorResponse('Invalid email or password', 401, 'INVALID_CREDENTIALS'));
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return next(new ErrorResponse('Invalid email or password', 401, 'INVALID_CREDENTIALS'));
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  registerSchema,
  loginSchema
};
