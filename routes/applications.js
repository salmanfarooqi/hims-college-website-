const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Application = require('../models/Application');
const multer = require('multer');
const path = require('path');
const { uploadDocument } = require('../utils/cloudinary');

// Configure multer for memory storage (for Vercel serverless compatibility)
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed for transaction receipts!'));
    }
  }
});

// Submit new application
router.post('/', upload.single('transactionReceipt'), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      zipCode,
      program,
      previousSchool,
      previousGrade,
      easypaisaNumber,
      transactionId
    } = req.body;

    // Check if transaction receipt is uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'Transaction receipt is required' });
    }

    // Check for duplicate transaction ID
    const existingApplication = await Application.findOne({ transactionId });
    if (existingApplication) {
      return res.status(400).json({ error: 'This transaction ID has already been used' });
    }

    // Upload file to Cloudinary
    let transactionReceiptUrl;
    try {
      // Create a temporary file object for Cloudinary
      const tempFile = {
        path: req.file.buffer, // Use buffer instead of file path
        originalname: req.file.originalname
      };
      
      // For memory storage, we need to handle the upload differently
      const cloudinary = require('cloudinary').v2;
      
      // Upload buffer to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: 'hims-college/transaction-receipts',
            resource_type: 'auto',
            public_id: `receipt-${Date.now()}-${Math.round(Math.random() * 1E9)}`
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(req.file.buffer);
      });
      
      transactionReceiptUrl = uploadResult.secure_url;
    } catch (uploadError) {
      console.error('Error uploading to Cloudinary:', uploadError);
      return res.status(500).json({ error: 'Failed to upload transaction receipt. Please try again.' });
    }

    const application = new Application({
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      zipCode,
      program,
      previousSchool,
      previousGrade,
      paymentAmount: '200', // Fixed amount
      easypaisaNumber,
      transactionId,
      transactionReceipt: transactionReceiptUrl // Store Cloudinary URL instead of local path
    });

    await application.save();

    res.status(201).json({
      message: 'Application submitted successfully',
      applicationId: application._id,
      status: 'pending'
    });
  } catch (error) {
    console.error('Error creating application:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
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
        totalPayments: 0,
        message: 'Database temporarily unavailable - showing fallback data'
      });
    }

    const totalApplications = await Application.countDocuments();
    const pendingApplications = await Application.countDocuments({ status: 'pending' });
    const approvedApplications = await Application.countDocuments({ status: 'approved' });
    const rejectedApplications = await Application.countDocuments({ status: 'rejected' });

    // Calculate total payments (assuming all applications paid Rs. 200)
    const totalPayments = totalApplications * 200;

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
      totalPayments,
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
        byMonth: [],
        totalPayments: 0
      }
    });
  }
});

// Get application status by email (for tracking)
router.get('/status/:email', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const application = await Application.findOne({ email: email.toLowerCase() })
      .select('status firstName lastName program paymentAmount transactionId createdAt notes')
      .sort({ createdAt: -1 }); // Get the most recent application if multiple exist
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found with this email address' });
    }

    res.json({
      id: application._id,
      firstName: application.firstName,
      lastName: application.lastName,
      email: email,
      program: application.program,
      status: application.status,
      applicationDate: application.createdAt,
      notes: application.notes || ''
    });
  } catch (error) {
    console.error('Error fetching application status by email:', error);
    res.status(500).json({ error: 'Failed to fetch application status' });
  }
});

// Get application status by transaction ID
router.get('/status/transaction/:transactionId', async (req, res) => {
  try {
    const application = await Application.findOne({ transactionId: req.params.transactionId })
      .select('status firstName lastName fatherName program paymentAmount createdAt');
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found with this transaction ID' });
    }

    res.json({
      status: application.status,
      name: `${application.firstName} ${application.lastName}`,
      fatherName: application.fatherName,
      program: application.program,
      paymentAmount: application.paymentAmount,
      submittedDate: application.createdAt,
      transactionId: req.params.transactionId
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch application status' });
  }
});

// Get application status by ID
router.get('/status/:id', async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .select('status firstName lastName fatherName program paymentAmount transactionId createdAt');
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({
      status: application.status,
      name: `${application.firstName} ${application.lastName}`,
      fatherName: application.fatherName,
      program: application.program,
      paymentAmount: application.paymentAmount,
      transactionId: application.transactionId,
      submittedDate: application.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch application status' });
  }
});

// Update application status (Admin only)
router.put('/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    // Validate status
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Update the application
    application.status = status;
    if (notes) {
      application.notes = notes;
    }
    
    await application.save();

    res.json({
      message: 'Application status updated successfully',
      application: {
        _id: application._id,
        firstName: application.firstName,
        lastName: application.lastName,
        status: application.status,
        notes: application.notes
      }
    });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ error: 'Failed to update application status' });
  }
});

module.exports = router; 