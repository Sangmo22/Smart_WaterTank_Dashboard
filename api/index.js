const connectDB = require('../backend/src/config/db');
const app = require('../backend/src/app');

// Ensure database connection is established
connectDB();

module.exports = app;
