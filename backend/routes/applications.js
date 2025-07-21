const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadDocument } = require('../utils/cloudinary');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
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
router.post('/', upload.array('documents', 5), async (req, res) => {
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
      previousGrade
    } = req.body;

    // Check if application already exists for this email
    const existingApplication = await Application.findOne({ where: { email } });
    if (existingApplication) {
      return res.status(400).json({ error: 'Application already exists for this email' });
    }

    // Process uploaded files and upload to Cloudinary
    const documents = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const uploadResult = await uploadDocument(file, 'hims-college/applications');
          
          // Clean up uploaded file
          fs.unlinkSync(file.path);
          
          documents.push({
            filename: uploadResult.original_name,
            originalName: uploadResult.original_name,
            url: uploadResult.url,
            publicId: uploadResult.public_id
          });
        } catch (error) {
          console.error('Error uploading document:', error);
          // Clean up uploaded file even if Cloudinary upload fails
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        }
      }
    }

    const application = await Application.create({
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
      documents
    });

    res.status(201).json({
      message: 'Application submitted successfully',
      applicationId: application.id
    });
  } catch (error) {
    console.error('Application submission error:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// Get application status by email
router.get('/status/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const application = await Application.findOne({ where: { email } });
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({
      status: application.status,
      applicationDate: application.applicationDate,
      notes: application.notes
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get application status' });
  }
});

module.exports = router; 