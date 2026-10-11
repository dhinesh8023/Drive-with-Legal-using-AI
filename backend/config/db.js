const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/drive_legal_ai');
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Failed to connect to MongoDB: ${error.message}`);
    // In demo environment, allow server to boot or retry without crashing completely if Mongo is temporarily offline
    console.warn(`[Database Warning] Operating in resilient mode. Ensure MongoDB is running on ${process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/drive_legal_ai'}`);
  }
};

module.exports = connectDB;
