const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const sharp = require('sharp');

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dwtru703l',
  api_key: '964741116272599',
  api_secret: 'QckGC-axVOaemElOzmt50-rDepA'
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = async (fileBuffer, originalname, folder) => {
  try {
    console.log('🖼️ Processing image for upload...');
    console.log('📏 Original size:', Math.round(fileBuffer.length / 1024 / 1024 * 100) / 100, 'MB');
    console.log('📄 File type:', originalname.split('.').pop().toLowerCase());
    
    let compressedBuffer = fileBuffer;
    let quality = 80;
    let maxWidth = 1920;
    let maxHeight = 1080;
    
    // More aggressive compression for large files
    if (fileBuffer.length > 50 * 1024 * 1024) {
      quality = 50;
      maxWidth = 1200;
      maxHeight = 800;
    } else if (fileBuffer.length > 20 * 1024 * 1024) {
      quality = 60;
      maxWidth = 1600;
      maxHeight = 900;
    } else if (fileBuffer.length > 10 * 1024 * 1024) {
      quality = 70;
      maxWidth = 1800;
      maxHeight = 1000;
    }
    
    // Try to process the image with Sharp
    try {
      console.log('🔧 Attempting image compression with Sharp...');
      
      const metadata = await sharp(fileBuffer).metadata();
      console.log('📊 Image metadata:', {
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        channels: metadata.channels
      });
      
      compressedBuffer = await sharp(fileBuffer, {
        failOnError: false,
        limitInputPixels: false
      })
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ 
          quality: quality,
          progressive: true,
          mozjpeg: true
        })
        .toBuffer();
      
      console.log('📏 Compressed size:', Math.round(compressedBuffer.length / 1024 / 1024 * 100) / 100, 'MB');
      console.log('📊 Compression ratio:', Math.round((1 - compressedBuffer.length / fileBuffer.length) * 100) + '%');
      
    } catch (sharpError) {
      console.error('❌ Sharp processing failed:', sharpError.message);
      console.log('🔄 Using original file buffer without processing');
      compressedBuffer = fileBuffer;
    }
    
    // Upload to Cloudinary
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          public_id: `${Date.now()}-${Math.round(Math.random() * 1E9)}`,
          transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ],
          chunk_size: 6000000,
          eager: [
            { width: 800, height: 600, crop: 'fill', quality: 'auto' },
            { width: 400, height: 300, crop: 'fill', quality: 'auto' }
          ],
          eager_async: true
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('✅ Image uploaded to Cloudinary successfully');
            console.log('📊 Upload result:', {
              url: result.secure_url,
              public_id: result.public_id,
              bytes: result.bytes,
              format: result.format,
              width: result.width,
              height: result.height
            });
            resolve(result.secure_url);
          }
        }
      );
      
      uploadStream.on('error', (error) => {
        console.error('❌ Upload stream error:', error);
        reject(error);
      });
      
      uploadStream.end(compressedBuffer);
    });
  } catch (error) {
    console.error('❌ Image processing error:', error);
    throw new Error(`Failed to process image: ${error.message}`);
  }
};

// Generate a proper black and white square profile image
const generateProfileImage = (name) => {
  const svgContent = `
    <svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <!-- White background -->
      <rect x="0" y="0" width="400" height="400" fill="#ffffff"/>
      
      <!-- Black border -->
      <rect x="0" y="0" width="400" height="400" fill="none" stroke="#000000" stroke-width="3"/>
      
      <!-- Black and white person icon in center -->
      <g transform="translate(200, 200)">
        <!-- Head -->
        <circle cx="0" cy="-40" r="45" fill="#000000"/>
        <circle cx="0" cy="-40" r="40" fill="#ffffff"/>
        <circle cx="0" cy="-40" r="35" fill="#000000"/>
        
        <!-- Body -->
        <path d="M-60 30 Q-60 -20 0 -20 Q60 -20 60 30 L60 90 L-60 90 Z" fill="#000000"/>
        <path d="M-55 35 Q-55 -15 0 -15 Q55 -15 55 35 L55 85 L-55 85 Z" fill="#ffffff"/>
        <path d="M-50 40 Q-50 -10 0 -10 Q50 -10 50 40 L50 80 L-50 80 Z" fill="#000000"/>
      </g>
      
      <!-- Teacher name at bottom -->
      <text x="200" y="350" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#000000">${name}</text>
    </svg>
  `;
  return Buffer.from(svgContent);
};

// Helper function to check if database is ready
const isDatabaseReady = () => {
  return mongoose.connection.readyState === 1;
};

// Get all active teachers (public)
router.get('/', async (req, res) => {
  try {
    console.log('Fetching teachers...');
    
    // Check if database is ready
    if (!isDatabaseReady()) {
      console.log('Database not ready, returning fallback data');
      return res.json({
        teachers: [],
        message: 'Database temporarily unavailable - showing fallback data',
        fallback: true
      });
    }
    
    // Fix: Use isActive instead of status to match the Teacher model
    const teachers = await Teacher.find({ isActive: true })
      .select('-__v')
      .sort({ order: 1, name: 1 });  // Also fix sorting to match content.js
    
    console.log(`Returning ${teachers.length} active teachers`);
    res.json({
      teachers,
      fallback: false
    });
    
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch teachers',
      message: 'Database connection issue. Please try again later.',
      fallbackData: {
        teachers: [],
        fallback: true
      }
    });
  }
});

// Get teacher by ID (public)
router.get('/:id', async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      console.log('Database not ready, returning fallback teacher data');
      return res.json({
        message: 'Database temporarily unavailable - showing fallback data',
        fallback: true
      });
    }
    
    const teacher = await Teacher.findById(req.params.id).select('-__v');
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    res.json({
      ...teacher.toObject(),
      fallback: false
    });
  } catch (error) {
    console.error('Error fetching teacher:', error);
    res.status(500).json({ 
      error: 'Failed to fetch teacher',
      message: 'Database connection issue. Please try again later.',
      fallback: true
    });
  }
});

// Admin endpoints for teachers
router.get('/admin/all', auth, async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      console.log('Database not ready, returning fallback admin teachers data');
      return res.json({
        teachers: [],
        message: 'Database temporarily unavailable - showing fallback data',
        fallback: true
      });
    }
    
    const teachers = await Teacher.find()
      .select('-__v')
      .sort({ lastName: 1, firstName: 1 });
    
    res.json({
      teachers,
      fallback: false
    });
  } catch (error) {
    console.error('Error fetching admin teachers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch teachers',
      message: 'Database connection issue. Please try again later.',
      fallbackData: {
        teachers: [],
        fallback: true
      }
    });
  }
});

// Create new teacher (admin only)
router.post('/admin', auth, async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      console.log('Database not ready, cannot create teacher');
      return res.status(503).json({ 
        error: 'Database not available',
        message: 'Cannot create teacher while database is unavailable. Please try again later.',
        fallback: true
      });
    }
    
    const teacher = new Teacher(req.body);
    await teacher.save();
    
    // Automatically generate and upload profile image if no imageUrl is provided
    if (!teacher.imageUrl || teacher.imageUrl === '') {
      try {
        console.log(`🔄 Generating profile image for: ${teacher.name}`);
        
        // Generate profile image
        const imageBuffer = generateProfileImage(teacher.name);
        
        // Upload to Cloudinary
        const imageUrl = await uploadToCloudinary(
          imageBuffer, 
          `teacher-${teacher.name.toLowerCase().replace(/\s+/g, '-')}-profile.png`,
          'hims-college/teachers'
        );
        
        // Update teacher with the image URL
        teacher.imageUrl = imageUrl;
        await teacher.save();
        
        console.log(`✅ Profile image uploaded for: ${teacher.name}`);
        console.log(`📸 Image URL: ${imageUrl}`);
        
      } catch (imageError) {
        console.error(`❌ Failed to upload profile image for ${teacher.name}:`, imageError.message);
        // Don't fail the teacher creation if image upload fails
      }
    }
    
    res.status(201).json({ 
      message: 'Teacher created successfully', 
      teacher,
      fallback: false
    });
  } catch (error) {
    console.error('Error creating teacher:', error);
    res.status(500).json({ 
      error: 'Failed to create teacher',
      message: 'Database connection issue or validation error. Please check your data and try again.',
      details: error.message
    });
  }
});

// Update teacher (admin only)
router.put('/admin/:id', auth, async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      console.log('Database not ready, cannot update teacher');
      return res.status(503).json({ 
        error: 'Database not available',
        message: 'Cannot update teacher while database is unavailable. Please try again later.',
        fallback: true
      });
    }
    
    const teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    // Automatically generate and upload profile image if no imageUrl is provided
    if (!teacher.imageUrl || teacher.imageUrl === '') {
      try {
        console.log(`🔄 Generating profile image for updated teacher: ${teacher.name}`);
        
        // Generate profile image
        const imageBuffer = generateProfileImage(teacher.name);
        
        // Upload to Cloudinary
        const imageUrl = await uploadToCloudinary(
          imageBuffer, 
          `teacher-${teacher.name.toLowerCase().replace(/\s+/g, '-')}-profile.png`,
          'hims-college/teachers'
        );
        
        // Update teacher with the image URL
        teacher.imageUrl = imageUrl;
        await teacher.save();
        
        console.log(`✅ Profile image uploaded for updated teacher: ${teacher.name}`);
        console.log(`📸 Image URL: ${imageUrl}`);
        
      } catch (imageError) {
        console.error(`❌ Failed to upload profile image for updated teacher ${teacher.name}:`, imageError.message);
        // Don't fail the teacher update if image upload fails
      }
    }
    
    res.json({ 
      message: 'Teacher updated successfully', 
      teacher,
      fallback: false
    });
  } catch (error) {
    console.error('Error updating teacher:', error);
    res.status(500).json({ 
      error: 'Failed to update teacher',
      message: 'Database connection issue or validation error. Please check your data and try again.',
      details: error.message
    });
  }
});

// Delete teacher (admin only)
router.delete('/admin/:id', auth, async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      console.log('Database not ready, cannot delete teacher');
      return res.status(503).json({ 
        error: 'Database not available',
        message: 'Cannot delete teacher while database is unavailable. Please try again later.',
        fallback: true
      });
    }
    
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    res.json({ 
      message: 'Teacher deleted successfully',
      fallback: false
    });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    res.status(500).json({ 
      error: 'Failed to delete teacher',
      message: 'Database connection issue. Please try again later.',
      details: error.message
    });
  }
});

// Get teacher statistics (admin only)
router.get('/admin/stats', auth, async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      console.log('Database not ready, returning fallback teacher statistics');
      return res.json({
        total: 0,
        active: 0,
        inactive: 0,
        retired: 0,
        departmentStats: [],
        message: 'Database temporarily unavailable - showing fallback data',
        fallback: true
      });
    }
    
    const totalTeachers = await Teacher.countDocuments();
    const activeTeachers = await Teacher.countDocuments({ status: 'active' });
    const inactiveTeachers = await Teacher.countDocuments({ status: 'inactive' });
    const retiredTeachers = await Teacher.countDocuments({ status: 'retired' });
    
    const departmentStats = await Teacher.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          department: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);
    
    res.json({
      total: totalTeachers,
      active: activeTeachers,
      inactive: inactiveTeachers,
      retired: retiredTeachers,
      departmentStats,
      fallback: false
    });
  } catch (error) {
    console.error('Error fetching teacher statistics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch teacher statistics',
      message: 'Database connection issue. Please try again later.',
      fallbackData: {
        total: 0,
        active: 0,
        inactive: 0,
        retired: 0,
        departmentStats: []
      }
    });
  }
});

module.exports = router;