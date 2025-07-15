const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const permitRoutes = require('./routes/permits');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config();

const app = express();
const PORT = 5001;

// Connect to database
connectDB();

// Trust proxy for Replit environment
app.set('trust proxy', true);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// CORS configuration - Allow all origins
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200 // For legacy browser support
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'CITES Permit Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/permits', require('./routes/permits'));
app.use('/api/payments', require('./routes/payments'));

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on http://0.0.0.0:${PORT}`);
  console.log(`Environment: ${process.env.REACT_APP_NODE_ENV || 'development'}`);
});

module.exports = app;