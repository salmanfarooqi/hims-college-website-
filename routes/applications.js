const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Application = require('../models/Application');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image, PDF, and document files are allowed!'));
    }
  }
});

// Submit new application
router.post('/', upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'idProof', maxCount: 1 },
  { name: 'academicRecords', maxCount: 5 },
  { name: 'otherDocuments', maxCount: 5 }
]), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      program,
      address,
      education
    } = req.body;

    // Prepare documents object
    const documents = {};
    if (req.files.photo) {
      documents.photo = req.files.photo[0].path;
    }
    if (req.files.idProof) {
      documents.idProof = req.files.idProof[0].path;
    }
    if (req.files.academicRecords) {
      documents.academicRecords = req.files.academicRecords.map(file => file.path);
    }
    if (req.files.otherDocuments) {
      documents.otherDocuments = req.files.otherDocuments.map(file => file.path);
    }

    // Parse address and education if they're strings
    const parsedAddress = typeof address === 'string' ? JSON.parse(address) : address;
    const parsedEducation = typeof education === 'string' ? JSON.parse(education) : education;

    const application = new Application({
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      program,
      address: parsedAddress,
      education: parsedEducation,
      documents
    });

    await application.save();

    res.status(201).json({
      message: 'Application submitted successfully',
      applicationId: application._id
    });
  } catch (error) {
    console.error('Application submission error:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// Get all applications (public endpoint for checking applications)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, program } = req.query;
    const skip = (page - 1) * limit;
    
    let filter = {};
    if (status) filter.status = status;
    if (program) filter.program = program;

    const applications = await Application.find(filter)
      .select('firstName lastName email program status createdAt')
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
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Get application statistics
router.get('/statistics', async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('Database not connected, returning fallback statistics');
      return res.json({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        byProgram: [],
        byMonth: [],
        message: 'Database temporarily unavailable - showing fallback data'
      });
    }

    const totalApplications = await Application.countDocuments();
    const pendingApplications = await Application.countDocuments({ status: 'pending' });
    const approvedApplications = await Application.countDocuments({ status: 'approved' });
    const rejectedApplications = await Application.countDocuments({ status: 'rejected' });

    // Get applications by program
    const programStats = await Application.aggregate([
      {
        $group: {
          _id: '$program',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get applications by month
    const monthlyStats = await Application.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      total: totalApplications,
      pending: pendingApplications,
      approved: approvedApplications,
      rejected: rejectedApplications,
      byProgram: programStats,
      byMonth: monthlyStats
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      message: 'Database connection issue. Please try again later.',
      fallbackData: {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        byProgram: [],
        byMonth: []
      }
    });
  }
});

// Get application status
router.get('/status/:id', async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .select('status firstName lastName program createdAt');
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({
      status: application.status,
      name: `${application.firstName} ${application.lastName}`,
      program: application.program,
      submittedDate: application.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch application status' });
  }
});

module.exports = router; 