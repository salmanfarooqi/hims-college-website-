// api/server.js
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../config.env') });

const sequelize = require(path.join(__dirname, '../config/database'));
const Application = require(path.join(__dirname, '../models/Application'));
const Admin = require(path.join(__dirname, '../models/Admin'));
const HeroSlide = require(path.join(__dirname, '../models/HeroSlide'));
const Teacher = require(path.join(__dirname, '../models/Teacher'));
const Student = require(path.join(__dirname, '../models/Student'));

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check for root path
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'HIMS Backend API is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      applications: '/api/applications',
      admin: '/api/admin',
      content: '/api/content'
    }
  });
});

// Health check for API root
app.get('/api', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'HIMS Backend API is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      applications: '/api/applications',
      admin: '/api/admin',
      content: '/api/content'
    }
  });
});

// Routes
app.use('/api/applications', require(path.join(__dirname, '../routes/applications')));
app.use('/api/admin', require(path.join(__dirname, '../routes/admin')));
app.use('/api/content', require(path.join(__dirname, '../routes/content')));

// Sync the database (only once per cold start)
sequelize.sync({ force: false }).then(() => {
  console.log('Database synced on serverless startup');
}).catch(err => {
  console.error('Database sync failed:', err);
});

module.exports = serverless(app);
