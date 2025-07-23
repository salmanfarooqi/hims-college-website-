const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Application = require('../models/Application');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Temporary hardcoded admin for testing when database is unavailable
    if (email === 'hims@gmail.com' && password === 'hims123') {
      const token = jwt.sign(
        { 
          id: 'temp-admin-id', 
          email: 'hims@gmail.com', 
          role: 'super_admin' 
        },
        process.env.JWT_SECRET || 'fallback-secret-key',
        { expiresIn: '24h' }
      );

      return res.json({
        token,
        admin: {
          id: 'temp-admin-id',
          email: 'hims@gmail.com',
          name: 'HIMS College Administrator',
          role: 'super_admin'
        },
        message: 'Login successful (temporary admin)'
      });
    }
    
    // Try database lookup if hardcoded admin doesn't match
    try {
      const admin = await Admin.findOne({ email }).maxTimeMS(5000);
      if (!admin) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isPasswordValid = await admin.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: admin._id, email: admin.email, role: admin.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        admin: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
          role: admin.role
        },
        message: 'Login successful (database admin)'
      });
    } catch (dbError) {
      console.log('Database lookup failed, using hardcoded admin');
      console.error('Database error details:', dbError.message);
      
      // Return a more informative response when database is unavailable
      return res.status(503).json({ 
        error: 'Database temporarily unavailable',
        message: 'Please try again later or contact administrator',
        fallbackAvailable: true,
        fallbackCredentials: {
          email: 'hims@gmail.com',
          password: 'hims123'
        }
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get all applications (protected route)
router.get('/applications', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, program } = req.query;
    const skip = (page - 1) * limit;
    
    let filter = {};
    if (status) filter.status = status;
    if (program) filter.program = program;

    const applications = await Application.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(filter);

    res.json({
      applications,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Get single application
router.get('/applications/:id', auth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json(application);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// Update application status
router.patch('/applications/:id', auth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    application.status = status;
    if (notes) application.notes = notes;
    await application.save();

    res.json({ message: 'Application updated successfully', application });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// Get application statistics
router.get('/statistics', auth, async (req, res) => {
  try {
    const totalApplications = await Application.countDocuments();
    const pendingApplications = await Application.countDocuments({ status: 'pending' });
    const approvedApplications = await Application.countDocuments({ status: 'approved' });
    const rejectedApplications = await Application.countDocuments({ status: 'rejected' });

    const programStats = await Application.aggregate([
      {
        $group: {
          _id: '$program',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          program: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    res.json({
      total: totalApplications,
      pending: pendingApplications,
      approved: approvedApplications,
      rejected: rejectedApplications,
      programStats
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Create admin account (for initial setup)
router.post('/setup', async (req, res) => {
  try {
    console.log('Attempting to create admin...');
    
    // Check if admin with specific email already exists
    const existingAdmin = await Admin.findOne({ email: 'hims@gmail.com' });
    if (existingAdmin) {
      console.log('Admin already exists');
      return res.status(400).json({ 
        error: 'Admin already exists', 
        message: 'Admin with email hims@gmail.com already exists',
        admin: {
          email: existingAdmin.email,
          name: existingAdmin.name,
          role: existingAdmin.role
        }
      });
    }

    console.log('Creating new admin...');
    const admin = await Admin.create({
      email: 'hims@gmail.com',
      password: 'hims123',
      name: 'HIMS College Administrator',
      role: 'super_admin'
    });

    console.log('Admin created successfully');
    res.json({ 
      message: 'Admin account created successfully',
      email: 'hims@gmail.com',
      password: 'hims123',
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create admin account',
      details: error.message 
    });
  }
});

module.exports = router; 