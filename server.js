require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { attachAuditContext } = require("./middleware/auditMiddleware");

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const violationRoutes = require("./routes/violationRoutes");
const fineRoutes = require("./routes/fineRoutes");
const fineRuleRoutes = require("./routes/fineRuleRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const fastagRoutes = require("./routes/fastagRoutes");
const disputeRoutes = require("./routes/disputeRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const hazardRoutes = require("./routes/hazardRoutes");
const nearMissRoutes = require("./routes/nearMissRoutes");
const blackspotRoutes = require("./routes/blackspotRoutes");
const drivingRoutes = require("./routes/drivingRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const aiRoutes = require("./routes/aiRoutes");
const receiptRoutes = require("./routes/receiptRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");

const app = express();
const server = http.createServer(app);

// Socket.IO — real-time events (risk updates, new violations, fines, payments, hazards, emergencies)
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || "*", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log(`[SOCKET] Client connected: ${socket.id}`);

  // Clients join a room named after their user/role so events can be targeted.
  socket.on("join", ({ userId, role }) => {
    if (userId) socket.join(`user:${userId}`);
    if (role) socket.join(`role:${role}`);
  });

  socket.on("disconnect", () => {
    console.log(`[SOCKET] Client disconnected: ${socket.id}`);
  });
});

// Make io accessible in controllers via req.app.get("io")
app.set("io", io);

// --- Security & core middleware ---
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(attachAuditContext);

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later.", errors: [] },
});
app.use("/api/", limiter);

// --- Health check ---
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Drive Legal AI backend is running.", timestamp: new Date() });
});

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/violations", violationRoutes);
app.use("/api/fines", fineRoutes);
app.use("/api/fine-rules", fineRuleRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/fastag", fastagRoutes);
app.use("/api/disputes", disputeRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/hazards", hazardRoutes);
app.use("/api/near-miss", nearMissRoutes);
app.use("/api/blackspots", blackspotRoutes);
app.use("/api/driving", drivingRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/emergency", emergencyRoutes);

// --- 404 + error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`\n🚗 DRIVE LEGAL AI backend running on port ${PORT}`);
    console.log(`   Mode: ${process.env.NODE_ENV || "development"}`);
    console.log(`   Payment mode: ${process.env.PAYMENT_MODE || "demo"} | FASTag: ${process.env.FASTAG_MODE || "demo"} | Notifications: ${process.env.NOTIFICATION_MODE || "demo"}\n`);
  });
}

start();

module.exports = { app, server, io };
