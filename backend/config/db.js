const mongoose = require("mongoose");

/**
 * Connects to MongoDB using the URI supplied in environment variables.
 * Fails fast with a clear message if the connection cannot be established,
 * since every other part of the platform depends on the database.
 */
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/drive_legal_ai";

    mongoose.set("strictQuery", true);

    const conn = await mongoose.connect(uri, {
      // Modern mongoose (8.x) no longer needs useNewUrlParser/useUnifiedTopology,
      // but we keep the options object for clarity/future flags.
    });

    console.log(`[DB] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on("error", (err) => {
      console.error("[DB] MongoDB connection error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("[DB] MongoDB disconnected. Attempting to reconnect is handled by the driver.");
    });

    return conn;
  } catch (error) {
    console.error(`[DB] Failed to connect to MongoDB: ${error.message}`);
    console.error("[DB] Ensure MongoDB is running and MONGO_URI is set correctly in .env");
    process.exit(1);
  }
};

module.exports = connectDB;
