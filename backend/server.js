const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const violationRoutes = require('./routes/violationRoutes');
const fineRoutes = require('./routes/fineRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const fastagRoutes = require('./routes/fastagRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const disputeRoutes = require('./routes/disputeRoutes');
const hazardRoutes = require('./routes/hazardRoutes');
const drivingRoutes = require('./routes/drivingRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.IO Setup with permissive CORS for development/demo
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Attach Socket.io instance to app for controller broadcast access
app.set('socketio', io);

// Security & General Middlewares
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to API routes
app.use('/api', apiLimiter);

// Serve static receipts, evidence uploads & frontend files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/receipts', express.static(path.join(__dirname, 'public/receipts')));
app.use(express.static(path.join(__dirname, '../frontend')));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'Drive Legal AI Core Backend',
    version: '1.0.0 (SIH 2026)',
    timestamp: new Date().toISOString(),
  });
});

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/violations', violationRoutes);
app.use('/api/fines', fineRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/fastag', fastagRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/hazards', hazardRoutes);
app.use('/api/driving', drivingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);

// Socket.IO Real-time Connection Lifecycle
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join_vehicle_telemetry', (vehicleNumber) => {
    socket.join(`vehicle_${vehicleNumber}`);
    logger.info(`Socket ${socket.id} subscribed to vehicle_${vehicleNumber}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found on Drive Legal AI Gateway.`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`
=====================================================
🚗 DRIVE LEGAL AI — BACKEND RUNNING
=====================================================
• Mode:           ${process.env.NODE_ENV || 'development'}
• Port:           ${PORT}
• API Base URL:   http://127.0.0.1:${PORT}/api
• Health Check:   http://127.0.0.1:${PORT}/api/health
• Static UI:      http://127.0.0.1:${PORT}/index.html
=====================================================
    `);
  });
}

module.exports = app;

