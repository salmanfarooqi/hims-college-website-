const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: './config.env' });

const connectDB = require('./config/database');
const Application = require('./models/Application');
const Admin = require('./models/Admin');
const HeroSlide = require('./models/HeroSlide');
const Teacher = require('./models/Teacher');
const Student = require('./models/Student');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => res.send("Express on Vercel"));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Database connection and server start
const startServer = async () => {
  try {
    // Connect to MongoDB FIRST
    await connectDB();
    console.log('MongoDB connected successfully');

    // THEN set up routes after database is connected
    app.use('/api/applications', require('./routes/applications'));
    app.use('/api/admin', require('./routes/admin'));
    app.use('/admin/api', require('./routes/admin')); // Additional route for /admin/api pattern
    app.use('/api/content', require('./routes/content'));
    app.use('/api/teachers', require('./routes/teachers'));

    // Create uploads directory if it doesn't exist
    const fs = require('fs');
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 