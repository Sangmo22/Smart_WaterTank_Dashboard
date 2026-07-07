const mongoose = require('mongoose');

let mongoServer = null;

const connectDB = async () => {
  try {
    let mongoURI = process.env.MONGODB_URI;

    // Determine if we should attempt local connection first
    const isLocal = !mongoURI || mongoURI.includes('127.0.0.1') || mongoURI.includes('localhost');

    if (isLocal) {
      const uriToUse = mongoURI || 'mongodb://127.0.0.1:27017/smart-water-tank';
      console.log(`Attempting local MongoDB connection to ${uriToUse}...`);
      try {
        // Try to connect to local MongoDB with a short timeout
        const conn = await mongoose.connect(uriToUse, {
          serverSelectionTimeoutMS: 2000 // 2 seconds timeout
        });
        console.log(`MongoDB Connected (Local): ${conn.connection.host}`);
        return;
      } catch (localError) {
        console.log('Local MongoDB service is not running. Starting In-Memory MongoDB Server...');
        try {
          const { MongoMemoryServer } = require('mongodb-memory-server');
          mongoServer = await MongoMemoryServer.create();
          mongoURI = mongoServer.getUri();
        } catch (memError) {
          console.error('Failed to load or start mongodb-memory-server:', memError.message);
          throw localError; // Throw original local connection error if memory server fails
        }
      }
    }

    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
