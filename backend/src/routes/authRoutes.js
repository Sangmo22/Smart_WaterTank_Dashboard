const express = require('express');
const router = express.Router();
const { register, login, registerSchema, loginSchema } = require('../controllers/authController');
const validate = require('../middleware/validate');
const { authRateLimiter } = require('../middleware/rateLimiter');

router.post('/register', authRateLimiter, validate(registerSchema), register);
router.post('/login', authRateLimiter, validate(loginSchema), login);

module.exports = router;
