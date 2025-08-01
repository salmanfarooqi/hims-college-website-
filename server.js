const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const config = require('./config/app-config');

const { connectDB, closeConnection } = require('./config/database');

const app = express();
const PORT = config.PORT;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

app.use('/api/', limiter);

// Compression middleware
app.use(compression());

// Logging middleware
if (config.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// CORS configuration - Allow all origins for flexibility
const corsOptions = {
  origin: '*', // Allow all origins
  credentials: false, // Set to false when using wildcard origin
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
};

app.use(cors(corsOptions));

// Increase limits for large file uploads
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'HIMS Backend API', 
    version: '2.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Serve uploaded files with explicit CORS headers
app.use('/uploads', (req, res, next) => {
  // Set comprehensive CORS headers for image requests
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
}, express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/applications', require('./routes/applications'));
app.use('/api/admin', require('./routes/admin'));
app.use('/admin/api', require('./routes/admin')); // Additional route for /admin/api pattern
app.use('/api/content', require('./routes/content'));
app.use('/api/teachers', require('./routes/teachers'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle multer file size errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File too large',
      details: 'The uploaded file exceeds the maximum allowed size of 100MB',
      maxSize: '100MB',
      suggestion: 'Please try a smaller file or compress your image'
    });
  }
  
  // Handle multer field size errors
  if (err.code === 'LIMIT_FIELD_SIZE') {
    return res.status(413).json({
      error: 'Field too large',
      details: 'One of the form fields exceeds the maximum allowed size',
      maxSize: '100MB'
    });
  }
  
  // Handle multer file count errors
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(413).json({
      error: 'Too many files',
      details: 'You can only upload one file at a time'
    });
  }
  
  // Handle multer file filter errors
  if (err.message && err.message.includes('Only image files')) {
    return res.status(400).json({
      error: 'Invalid file type',
      details: err.message,
      allowedTypes: ['JPEG', 'JPG', 'PNG', 'GIF', 'WebP']
    });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.message
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format',
      details: err.message
    });
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message
  });
});

// Database connection and server start
const startServer = async () => {
  try {
    // Create uploads directory if it doesn't exist
    const fs = require('fs');
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Connect to MongoDB (with fallback support)
    await connectDB();

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌐 API base URL: http://localhost:${PORT}/api`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(async () => {
        await closeConnection();
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully');
      server.close(async () => {
        await closeConnection();
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app; 