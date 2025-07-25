const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('../config/app-config');

// Debug configuration
console.log('Configuration check:', {
  NODE_ENV: config.NODE_ENV,
  MONGODB_URI_EXISTS: !!config.MONGODB_URI,
  MONGODB_URI_LENGTH: config.MONGODB_URI ? config.MONGODB_URI.length : 0
});

const { connectDB, getConnectionStatus } = require('../config/database');
const Application = require('../models/Application');
const Admin = require('../models/Admin');
const HeroSlide = require('../models/HeroSlide');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');

const app = express();

// CORS configuration - Allow all origins for flexibility
const corsOptions = {
  origin: '*', // Allow all origins
  credentials: false, // Set to false when using wildcard origin
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection middleware
let connectionPromise = null;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

const ensureConnection = async (req, res, next) => {
  try {
    // Check if already connected
    if (getConnectionStatus && getConnectionStatus()) {
      return next();
    }
    
    // If connection is in progress, wait for it
    if (connectionPromise) {
      await connectionPromise;
      return next();
    }
    
    // Limit connection attempts
    if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
      console.log('Max connection attempts reached, proceeding without database');
      return next();
    }
    
    // Start new connection
    connectionAttempts++;
    console.log(`Database connection attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS}`);
    
    connectionPromise = connectDB();
    await connectionPromise;
    connectionPromise = null;
    
    next();
  } catch (error) {
    console.error('Database connection failed:', error);
    connectionPromise = null;
    
    // Don't fail the request, just log the error
    console.log('Proceeding without database connection');
    next();
  }
};

app.get("/", (req, res) => res.send("Express on Vercel"));

// Test route
app.get("/test", (req, res) => {
  res.json({ 
    message: "API is working!", 
    timestamp: new Date().toISOString(),
    dbConnected: getConnectionStatus && getConnectionStatus(),
    environment: config.NODE_ENV,
    mongoUri: config.MONGODB_URI ? 'Set' : 'Not Set'
  });
});

// Status route
app.get("/status", (req, res) => {
  res.json({
    api: "running",
    database: getConnectionStatus() ? "connected" : "disconnected",
    connectionAttempts: connectionAttempts,
    maxAttempts: MAX_CONNECTION_ATTEMPTS,
    timestamp: new Date().toISOString(),
    features: {
      heroSlides: "available (with fallback)",
      applications: "available (with fallback)",
      admin: "available (with fallback)"
    }
  });
});

// Database test route
app.get("/test-db", async (req, res) => {
  try {
    console.log('Testing database connection...');
    await connectDB();
    console.log('Database connection test successful');
    
    // Wait a bit for connection to stabilize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test a simple query
    const slideCount = await HeroSlide.countDocuments();
    console.log(`Found ${slideCount} hero slides`);
    
    res.json({ 
      message: "Database connection successful!", 
      slideCount,
      connectionStatus: getConnectionStatus(),
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({ 
      error: "Database connection failed", 
      details: error.message,
      timestamp: new Date().toISOString() 
    });
  }
});

// Serve uploaded files with CORS headers
app.use('/uploads', (req, res, next) => {
  // Set CORS headers for images
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Apply database connection middleware to all API routes
app.use('/api', ensureConnection);

// Routes
app.use('/api/applications', require('../routes/applications'));
app.use('/api/admin', require('../routes/admin'));
app.use('/api/content', require('../routes/content'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    dbConnected: getConnectionStatus(),
    connectionAttempts: connectionAttempts
  });
});

module.exports = app; 