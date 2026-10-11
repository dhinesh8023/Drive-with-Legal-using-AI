const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || (process.env.VERCEL ? null : 'mongodb://127.0.0.1:27017/drive_legal_ai');
    if (!uri) {
      console.warn('[Database] MONGO_URI not configured for cloud environment. Running in offline/demo mode.');
      return null;
    }
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`[Database Warning] Operating in resilient mode: ${error.message}`);
  }
};

module.exports = connectDB;
