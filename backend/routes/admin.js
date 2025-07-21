const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Application = require('../models/Application');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const sequelize = require('../config/database');
const config = require('../config/production');

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      config.jwt.secret,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get all applications (protected route)
router.get('/applications', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, program } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    if (status) whereClause.status = status;
    if (program) whereClause.program = program;

    const applications = await Application.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      applications: applications.rows,
      total: applications.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(applications.count / limit)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Get single application
router.get('/applications/:id', auth, async (req, res) => {
  try {
    const application = await Application.findByPk(req.params.id);
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
    const application = await Application.findByPk(req.params.id);
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    await application.update({ status, notes });
    res.json({ message: 'Application updated successfully', application });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// Get application statistics
router.get('/statistics', auth, async (req, res) => {
  try {
    const totalApplications = await Application.count();
    const pendingApplications = await Application.count({ where: { status: 'pending' } });
    const approvedApplications = await Application.count({ where: { status: 'approved' } });
    const rejectedApplications = await Application.count({ where: { status: 'rejected' } });

    const programStats = await Application.findAll({
      attributes: [
        'program',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['program']
    });

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
    const adminCount = await Admin.count();
    if (adminCount > 0) {
      return res.status(400).json({ error: 'Admin already exists' });
    }

    const admin = await Admin.create({
      email: config.admin.email,
      password: config.admin.password,
      name: 'College Administrator',
      role: 'super_admin'
    });

    res.json({ message: 'Admin account created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create admin account' });
  }
});

module.exports = router; 