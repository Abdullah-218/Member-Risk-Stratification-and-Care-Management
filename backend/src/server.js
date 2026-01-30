import express from 'express';
import cors from 'cors';
import 'express-async-errors';
import dotenv from 'dotenv';
import { config } from './config/index.js';
import { testConnection } from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

// Import route handlers
import authRoutes from './routes/auth.routes.js';
import membersRoutes from './routes/members.routes.js';
import predictionsRoutes from './routes/predictions.routes.js';
import interventionsRoutes from './routes/interventions.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import assessmentRoutes from './routes/assessment.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

const app = express();

/**
 * =====================================
 * MIDDLEWARE SETUP
 * =====================================
 */

// CORS Configuration - Allow both port 3001 and 3002
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3002', config.FRONTEND_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body Parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * =====================================
 * HEALTH CHECK ENDPOINT
 * =====================================
 */

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend service is running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * =====================================
 * API ROUTES
 * =====================================
 */

// Authentication routes
app.use('/api/auth', authRoutes);

// Dashboard routes (no auth for now)
app.use('/api/dashboard', dashboardRoutes);

// Members/Patients routes
app.use('/api/members', membersRoutes);

// Risk Predictions routes
app.use('/api/predictions', predictionsRoutes);

// Interventions routes
app.use('/api/interventions', interventionsRoutes);

// File Upload routes
app.use('/api/upload', uploadRoutes);

// Individual Assessment routes
app.use('/api/assessment', assessmentRoutes);

/**
 * =====================================
 * ERROR HANDLING
 * =====================================
 */

// 404 Not Found handler (must be last)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

/**
 * =====================================
 * START SERVER
 * =====================================
 */

const PORT = config.PORT;

const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.warn('⚠ Proceeding without database connection (mock mode)');
    }

    // Start Express server
    app.listen(PORT, () => {
      console.log('\n========================================');
      console.log('🏥 Healthcare Risk Backend Server');
      console.log('========================================');
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ API Base URL: http://localhost:${PORT}/api`);
      console.log(`✓ Frontend URL: ${config.FRONTEND_URL}`);
      console.log(`✓ Environment: ${config.NODE_ENV}`);
      console.log(`✓ Database: ${dbConnected ? 'Connected' : 'Mock Mode (No Database)'}`);
      console.log('========================================\n');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
