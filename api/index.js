const express = require('express');
const cors = require('cors');
const path = require('path');

// Load environment variables
try {
  require('dotenv').config({ path: './config.env' });
} catch (error) {
  console.log('config.env not found, using default environment variables');
}

const { connectDB } = require('../config/database');
const Application = require('../models/Application');
const Admin = require('../models/Admin');
const HeroSlide = require('../models/HeroSlide');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => res.send("Express on Vercel"));

// Test route
app.get("/test", (req, res) => {
  res.json({ message: "API is working!", timestamp: new Date().toISOString() });
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/applications', require('../routes/applications'));
app.use('/api/admin', require('../routes/admin'));
app.use('/api/content', require('../routes/content'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Connect to MongoDB
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) return;
  
  try {
    await connectDB();
    isConnected = true;
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

// Initialize database connection
connectToDatabase();

module.exports = app; 