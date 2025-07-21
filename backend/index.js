// api/server.js
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: './config.env' });

const sequelize = require('../config/database');
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
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/applications', require('../routes/applications'));
app.use('/api/admin', require('../routes/admin'));
app.use('/api/content', require('../routes/content'));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Serverless server is running' });
});

// Sync the database (only once per cold start)
sequelize.sync({ force: false }).then(() => {
  console.log('Database synced on serverless startup');
}).catch(err => {
  console.error('Database sync failed:', err);
});

module.exports = serverless(app);
