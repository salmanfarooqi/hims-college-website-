const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Application = require('../models/Application');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('../config/app-config');

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Temporary hardcoded admin for testing when database is unavailable
    if (email === config.ADMIN_EMAIL && password === config.ADMIN_PASSWORD) {
      const token = jwt.sign(
        { 
          id: 'temp-admin-id', 
          email: config.ADMIN_EMAIL, 
          role: 'super_admin' 
        },
        config.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        token,
        admin: {
          id: 'temp-admin-id',
          email: config.ADMIN_EMAIL,
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

// Get admin profile (protected)
router.get('/profile', auth, async (req, res) => {
  try {
    // Handle temporary admin
    if (req.admin._id === 'temp-admin-id') {
      return res.json({
        id: 'temp-admin-id',
        email: 'hims@gmail.com',
        name: 'HIMS College Administrator',
        role: 'super_admin'
      });
    }

    // Try database lookup for real admin
    try {
      const admin = await Admin.findById(req.admin._id).select('-password');
      if (!admin) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      res.json({
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      });
    } catch (dbError) {
      console.log('Database lookup failed in profile route');
      return res.status(503).json({ error: 'Database temporarily unavailable' });
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update admin profile (protected)
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email } = req.body;

    // Validation
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Handle temporary admin
    if (req.admin._id === 'temp-admin-id') {
      return res.status(400).json({ 
        error: 'Cannot update temporary admin profile',
        message: 'Please set up a proper database connection to update profile'
      });
    }

    // Try database update for real admin
    try {
      // Check if email is already taken by another admin
      if (email !== req.admin.email) {
        const existingAdmin = await Admin.findOne({ email, _id: { $ne: req.admin._id } });
        if (existingAdmin) {
          return res.status(400).json({ error: 'Email is already in use' });
        }
      }

      const admin = await Admin.findByIdAndUpdate(
        req.admin._id,
        { name, email },
        { new: true, runValidators: true }
      ).select('-password');

      if (!admin) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      res.json({
        message: 'Profile updated successfully',
        admin: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
          role: admin.role
        }
      });
    } catch (dbError) {
      console.log('Database update failed in profile route');
      return res.status(503).json({ error: 'Database temporarily unavailable' });
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change admin password (protected)
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Handle temporary admin
    if (req.admin._id === 'temp-admin-id') {
      return res.status(400).json({ 
        error: 'Cannot change temporary admin password',
        message: 'Please set up a proper database connection to change password'
      });
    }

    // Try database update for real admin
    try {
      const admin = await Admin.findById(req.admin._id);
      if (!admin) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      // Verify current password
      const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Update password (will be hashed by pre-save middleware)
      admin.password = newPassword;
      await admin.save();

      res.json({
        message: 'Password changed successfully'
      });
    } catch (dbError) {
      console.log('Database update failed in change-password route');
      return res.status(503).json({ error: 'Database temporarily unavailable' });
    }
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Get all applications (admin only)
router.get('/applications', auth, async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('Database not connected, returning empty array');
      return res.json([]);
    }

    const applications = await Application.find()
      .sort({ createdAt: -1 })
      .maxTimeMS(10000);
    
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
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
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('Database not connected, returning fallback statistics');
      return res.json({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        programStats: [],
        message: 'Database temporarily unavailable - showing fallback data'
      });
    }

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
    console.error('Error fetching admin statistics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      message: 'Database connection issue. Please try again later.',
      fallbackData: {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        programStats: []
      }
    });
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