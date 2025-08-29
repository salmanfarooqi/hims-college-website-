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
    fileSize: 100 * 1024 * 1024, // 100MB limit
    fieldSize: 100 * 1024 * 1024 // 100MB for other fields
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed for documents!'));
    }
  }
});

// Submit new application with multiple document uploads
router.post('/', upload.fields([
  { name: 'dmcMetric', maxCount: 1 },
  { name: 'passportPhoto', maxCount: 1 },
  { name: 'fatherCNIC', maxCount: 1 },
  { name: 'migrationCertificate', maxCount: 1 },
  { name: 'transactionReceipt', maxCount: 1 }
]), async (req, res) => {
  try {
    // Debug: Log received form data
    console.log('📥 Received form data:', req.body);
    console.log('📥 Education fields:', {
      year: req.body['education[metric][year]'],
      rollNumber: req.body['education[metric][rollNumber]'],
      marks: req.body['education[metric][marks]'],
      school: req.body['education[metric][school]']
    });

    // Handle both bracket notation and nested structure
    let metricYear, metricRollNumber, metricMarks, metricSchool;
    
    // Try bracket notation first
    if (req.body['education[metric][year]']) {
      metricYear = req.body['education[metric][year]'];
      metricRollNumber = req.body['education[metric][rollNumber]'];
      metricMarks = req.body['education[metric][marks]'];
      metricSchool = req.body['education[metric][school]'];
    }
    // Fallback to nested structure
    else if (req.body.education && req.body.education.metric) {
      metricYear = req.body.education.metric.year;
      metricRollNumber = req.body.education.metric.rollNumber;
      metricMarks = req.body.education.metric.marks;
      metricSchool = req.body.education.metric.school;
    }
    // Fallback to individual fields
    else {
      metricYear = req.body.metricYear || req.body.year;
      metricRollNumber = req.body.metricRollNumber || req.body.rollNumber;
      metricMarks = req.body.metricMarks || req.body.marks;
      metricSchool = req.body.metricSchool || req.body.school;
    }

    console.log('🎓 Parsed education fields:', {
      metricYear,
      metricRollNumber,
      metricMarks,
      metricSchool
    });

    // Validate that all required education fields are present
    if (!metricYear || !metricRollNumber || !metricMarks || !metricSchool) {
      console.error('❌ Missing required education fields:', {
        metricYear: !!metricYear,
        metricRollNumber: !!metricRollNumber,
        metricMarks: !!metricMarks,
        metricSchool: !!metricSchool
      });
      return res.status(400).json({ 
        error: 'Missing required education information. Please fill in all metric details: year, roll number, marks, and school.' 
      });
    }

    const {
      firstName,
      lastName,
      fatherName,
      email,
      phone,
      guardianPhone,
      dateOfBirth,
      gender,
      class: studentClass,
      group,
      address,
      city,
      state,
      zipCode,
      easypaisaNumber,
      transactionId
    } = req.body;

    // Check if required documents are uploaded
    if (!req.files.dmcMetric || !req.files.passportPhoto || !req.files.fatherCNIC || !req.files.transactionReceipt) {
      return res.status(400).json({ 
        error: 'Required documents missing. Please upload: DMC of Metric, Passport Photo, Father CNIC, and Transaction Receipt' 
      });
    }

    // Check for duplicate transaction ID
    const existingApplication = await Application.findOne({ transactionId });
    if (existingApplication) {
      return res.status(400).json({ error: 'This transaction ID has already been used' });
    }

    // Upload all documents to Cloudinary
    let dmcMetricUrl, passportPhotoUrl, fatherCNICUrl, migrationCertificateUrl, transactionReceiptUrl;
    
    try {
      const cloudinary = require('cloudinary').v2;
      
      // Upload DMC of Metric
      const dmcResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'hims-college/dmc-metric',
            resource_type: 'auto',
            public_id: `dmc-${Date.now()}-${Math.round(Math.random() * 1E9)}`,
            chunk_size: 6000000,
            eager: [
              { width: 800, height: 600, crop: 'fill', quality: 'auto' },
              { width: 400, height: 300, crop: 'fill', quality: 'auto' }
            ],
            eager_async: true
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.files.dmcMetric[0].buffer);
      });
      dmcMetricUrl = dmcResult.secure_url;

      // Upload Passport Photo
      const photoResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'hims-college/passport-photos',
            resource_type: 'auto',
            public_id: `photo-${Date.now()}-${Math.round(Math.random() * 1E9)}`,
            chunk_size: 6000000,
            eager: [
              { width: 400, height: 400, crop: 'fill', quality: 'auto' },
              { width: 200, height: 200, crop: 'fill', quality: 'auto' }
            ],
            eager_async: true
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.files.passportPhoto[0].buffer);
      });
      passportPhotoUrl = photoResult.secure_url;

      // Upload Father CNIC
      const cnicResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'hims-college/father-cnic',
            resource_type: 'auto',
            public_id: `cnic-${Date.now()}-${Math.round(Math.random() * 1E9)}`,
            chunk_size: 6000000,
            eager: [
              { width: 800, height: 600, crop: 'fill', quality: 'auto' },
              { width: 400, height: 300, crop: 'fill', quality: 'auto' }
            ],
            eager_async: true
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.files.fatherCNIC[0].buffer);
      });
      fatherCNICUrl = cnicResult.secure_url;

      // Upload Migration Certificate (optional)
      if (req.files.migrationCertificate) {
        const migrationResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'hims-college/migration-certificates',
              resource_type: 'auto',
              public_id: `migration-${Date.now()}-${Math.round(Math.random() * 1E9)}`,
              chunk_size: 6000000,
              eager: [
                { width: 800, height: 600, crop: 'fill', quality: 'auto' },
                { width: 400, height: 300, crop: 'fill', quality: 'auto' }
              ],
              eager_async: true
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(req.files.migrationCertificate[0].buffer);
        });
        migrationCertificateUrl = migrationResult.secure_url;
      }

      // Upload Transaction Receipt
      const receiptResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'hims-college/transaction-receipts',
            resource_type: 'auto',
            public_id: `receipt-${Date.now()}-${Math.round(Math.random() * 1E9)}`,
            chunk_size: 6000000,
            eager: [
              { width: 800, height: 600, crop: 'fill', quality: 'auto' },
              { width: 400, height: 300, crop: 'fill', quality: 'auto' }
            ],
            eager_async: true
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.files.transactionReceipt[0].buffer);
      });
      transactionReceiptUrl = receiptResult.secure_url;

    } catch (uploadError) {
      console.error('Error uploading to Cloudinary:', uploadError);
      return res.status(500).json({ error: 'Failed to upload documents. Please try again.' });
    }

    // Debug: Log application data being created
    console.log('🏗️ Creating application with data:', {
      firstName,
      lastName,
      fatherName,
      email,
      phone,
      guardianPhone,
      dateOfBirth,
      gender,
      class: studentClass,
      group,
      address,
      city,
      state,
      zipCode,
      education: {
        metric: {
          year: metricYear,
          rollNumber: metricRollNumber,
          marks: metricMarks,
          school: metricSchool
        }
      },
      documents: {
        dmcMetric: dmcMetricUrl,
        passportPhoto: passportPhotoUrl,
        fatherCNIC: fatherCNICUrl,
        migrationCertificate: migrationCertificateUrl
      },
      paymentAmount: '200',
      easypaisaNumber,
      transactionId,
      transactionReceipt: transactionReceiptUrl
    });

    const application = new Application({
      firstName,
      lastName,
      fatherName,
      email,
      phone,
      guardianPhone,
      dateOfBirth,
      gender,
      class: studentClass,
      group,
      address,
      city,
      state,
      zipCode,
      education: {
        metric: {
          year: metricYear,
          rollNumber: metricRollNumber,
          marks: metricMarks,
          school: metricSchool
        }
      },
      documents: {
        dmcMetric: dmcMetricUrl,
        passportPhoto: passportPhotoUrl,
        fatherCNIC: fatherCNICUrl,
        migrationCertificate: migrationCertificateUrl
      },
      paymentAmount: '200',
      easypaisaNumber,
      transactionId,
      transactionReceipt: transactionReceiptUrl
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
    const { page = 1, limit = 10, status, group } = req.query;
    const skip = (page - 1) * limit;
    
    let filter = {};
    if (status) filter.status = status;
    if (group) filter.group = group;

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
        byGroup: [],
        byClass: [],
        byMonth: [],
        totalPayments: 0,
        message: 'Database temporarily unavailable - showing fallback data'
      });
    }

    const totalApplications = await Application.countDocuments();
    const pendingApplications = await Application.countDocuments({ status: 'pending' });
    const approvedApplications = await Application.countDocuments({ status: 'approved' });
    const rejectedApplications = await Application.countDocuments({ status: 'rejected' });

    // Calculate total payments (assuming all applications paid Rs. 500)
    const totalPayments = totalApplications * 200;

    // Get applications by group
    const groupStats = await Application.aggregate([
      {
        $group: {
          _id: '$group',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get applications by class
    const classStats = await Application.aggregate([
      {
        $group: {
          _id: '$class',
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
      byGroup: groupStats,
      byClass: classStats,
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
        byGroup: [],
        byClass: [],
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
      .select('status firstName lastName group paymentAmount transactionId createdAt notes')
      .sort({ createdAt: -1 }); // Get the most recent application if multiple exist
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found with this email address' });
    }

    res.json({
      id: application._id,
      firstName: application.firstName,
      lastName: application.lastName,
      email: email,
      group: application.group,
      status: application.status,
      applicationDate: application.createdAt,
      notes: application.notes || ''
    });
  } catch (error) {
    console.error('Error fetching application status by email:', error);
    res.status(500).json({ error: 'Failed to fetch application status' });
  }
});

// Get application status by phone number (new tracking method)
router.get('/status/phone/:phone', async (req, res) => {
  try {
    const rawPhone = decodeURIComponent(req.params.phone).trim();
    // Normalize common PK formats to compare consistently (store as provided otherwise)
    // Accept both 03xxxxxxxxx and +923xxxxxxxxx
    const normalized = rawPhone.startsWith('+92')
      ? '0' + rawPhone.slice(3)
      : rawPhone;

    const application = await Application.findOne({ phone: normalized })
      .select('status firstName lastName fatherName group paymentAmount transactionId createdAt')
      .sort({ createdAt: -1 });

    if (!application) {
      // Try raw phone if normalization didn't match
      const fallback = await Application.findOne({ phone: rawPhone })
        .select('status firstName lastName fatherName group paymentAmount transactionId createdAt')
        .sort({ createdAt: -1 });
      if (!fallback) {
        return res.status(404).json({ error: 'Application not found with this phone number' });
      }
      return res.json({
        status: fallback.status,
        name: `${fallback.firstName} ${fallback.lastName}`.trim(),
        fatherName: fallback.fatherName,
        group: fallback.group,
        paymentAmount: fallback.paymentAmount,
        transactionId: fallback.transactionId,
        submittedDate: fallback.createdAt,
        phone: rawPhone
      });
    }

    res.json({
      status: application.status,
      name: `${application.firstName} ${application.lastName}`.trim(),
      fatherName: application.fatherName,
      group: application.group,
      paymentAmount: application.paymentAmount,
      transactionId: application.transactionId,
      submittedDate: application.createdAt,
      phone: normalized
    });
  } catch (error) {
    console.error('Error fetching application status by phone:', error);
    res.status(500).json({ error: 'Failed to fetch application status' });
  }
});

// Get application status by transaction ID
router.get('/status/transaction/:transactionId', async (req, res) => {
  try {
    const application = await Application.findOne({ transactionId: req.params.transactionId })
      .select('status firstName lastName fatherName group paymentAmount createdAt');
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found with this transaction ID' });
    }

    res.json({
      status: application.status,
      name: `${application.firstName} ${application.lastName}`,
      fatherName: application.fatherName,
      group: application.group,
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
      .select('status firstName lastName fatherName group paymentAmount transactionId createdAt');
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({
      status: application.status,
      name: `${application.firstName} ${application.lastName}`,
      fatherName: application.fatherName,
      group: application.group,
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