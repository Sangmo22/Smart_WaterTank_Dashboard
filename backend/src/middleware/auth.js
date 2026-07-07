const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route, no token provided', 401, 'NOT_AUTHORIZED'));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_change_me_in_production');

    // Retrieve user and attach to request context (excluding sensitive passwordHash)
    req.user = await User.findById(decoded.id).select('-passwordHash');
    if (!req.user) {
      return next(new ErrorResponse('Not authorized, user not found', 401, 'NOT_AUTHORIZED'));
    }

    next();
  } catch (error) {
    return next(new ErrorResponse('Not authorized, token is invalid or expired', 401, 'NOT_AUTHORIZED'));
  }
};

module.exports = { protect };
