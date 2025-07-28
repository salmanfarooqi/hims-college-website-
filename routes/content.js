const express = require('express');
const router = express.Router();
const HeroSlide = require('../models/HeroSlide');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');

// Configure multer for memory storage (Vercel compatible)
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    console.log('File upload attempt:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype
    });
    
    // Allow more image formats
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const allowedMimeTypes = /image\/(jpeg|jpg|png|gif|webp)/;
    
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimeTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      console.log('File accepted:', file.originalname);
      return cb(null, true);
    } else {
      console.log('File rejected:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        extension: path.extname(file.originalname)
      });
      cb(new Error(`Only image files (JPEG, PNG, GIF, WebP) are allowed! Received: ${file.mimetype}`));
    }
  }
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = async (fileBuffer, originalname, folder) => {
  const cloudinary = require('cloudinary').v2;
  
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'image',
        public_id: `${Date.now()}-${Math.round(Math.random() * 1E9)}`,
        transformation: [
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    ).end(fileBuffer);
  });
};

// Import connectDB function
const { connectDB } = require('../config/database');

// Helper function to check if database is ready
const isDatabaseReady = () => {
  return mongoose.connection.readyState === 1;
};

// Helper function to ensure database connection
const ensureDatabaseConnection = async () => {
  if (!isDatabaseReady()) {
    console.log('Database not ready, attempting to connect...');
    await connectDB();
    // Wait a moment for connection to stabilize
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return isDatabaseReady();
};

// Get all active hero slides (public) - Dynamic only, no hardcoded content
router.get('/hero-slides', async (req, res) => {
  try {
    console.log('Fetching hero slides from database...');
    
    // Ensure database connection
    const dbReady = await ensureDatabaseConnection();
    if (!dbReady) {
      console.log('Database connection failed, returning empty array');
      return res.json([]);
    }
    
    // Use a timeout promise to handle database operations
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timed out')), 5000);
    });
    
    const dbOperation = async () => {
      const slides = await HeroSlide.find({ isActive: true })
        .sort({ order: 1 })
        .select('-__v');
      
      console.log(`Returning ${slides.length} active hero slides from database`);
      return slides;
    };
    
    // Race between database operation and timeout
    const slides = await Promise.race([dbOperation(), timeoutPromise]);
    res.json(slides);
    
  } catch (error) {
    console.error('Error fetching hero slides:', error);
    
    // Return empty array if database fails - no hardcoded content
    console.log('Returning empty array due to database error');
    res.json([]);
  }
});

// Get all hero slides (admin only)
router.get('/admin/hero-slides', auth, async (req, res) => {
  try {
    const dbReady = await ensureDatabaseConnection();
    if (!dbReady) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const slides = await HeroSlide.find()
      .sort({ order: 1 });
    
    res.json(slides);
  } catch (error) {
    console.error('Error fetching admin hero slides:', error);
    res.status(500).json({ error: 'Failed to fetch hero slides' });
  }
});

// Create new hero slide (admin only)
router.post('/admin/hero-slides', auth, upload.single('image'), async (req, res) => {
  try {
    const dbReady = await ensureDatabaseConnection();
    if (!dbReady) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const {
      title,
      subtitle,
      description,
      order,
      isActive
    } = req.body;

    // Upload image to Cloudinary if provided
    let imageUrl = '';
    if (req.file) {
      try {
        imageUrl = await uploadToCloudinary(req.file.buffer, req.file.originalname, 'hims-college/hero-slides');
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return res.status(500).json({ error: 'Failed to upload image' });
      }
    }

    const slide = new HeroSlide({
      title,
      subtitle,
      description,
      imageUrl,
      order: order || 0,
      isActive: isActive !== 'false'
    });

    await slide.save();
    res.status(201).json({ message: 'Hero slide created successfully', slide });
  } catch (error) {
    console.error('Error creating hero slide:', error);
    res.status(500).json({ error: 'Failed to create hero slide' });
  }
});

// Update hero slide (admin only)
router.put('/admin/hero-slides/:id', auth, upload.single('image'), async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const {
      title,
      subtitle,
      description,
      order,
      isActive
    } = req.body;

    const slide = await HeroSlide.findById(req.params.id);
    if (!slide) {
      return res.status(404).json({ error: 'Hero slide not found' });
    }

    slide.title = title || slide.title;
    slide.subtitle = subtitle || slide.subtitle;
    slide.description = description || slide.description;
    slide.order = order !== undefined ? order : slide.order;
    slide.isActive = isActive !== undefined ? isActive : slide.isActive;

    if (req.file) {
      try {
        slide.imageUrl = await uploadToCloudinary(req.file.buffer, req.file.originalname, 'hims-college/hero-slides');
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return res.status(500).json({ error: 'Failed to upload image' });
      }
    }

    await slide.save();
    res.json({ message: 'Hero slide updated successfully', slide });
  } catch (error) {
    console.error('Error updating hero slide:', error);
    res.status(500).json({ error: 'Failed to update hero slide' });
  }
});

// Create new hero slide with Cloudinary URL (admin only) - New method
router.post('/admin/hero-slides-url', auth, async (req, res) => {
  try {
    console.log('🟢 POST /admin/hero-slides-url called');
    console.log('📝 Request body:', req.body);
    console.log('👤 User from auth:', req.user);
    
    const dbReady = await ensureDatabaseConnection();
    if (!dbReady) {
      console.log('❌ Database not ready');
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const {
      title,
      subtitle,
      description,
      imageUrl,
      order,
      isActive
    } = req.body;

    console.log('📋 Extracted fields:', { title, subtitle, description, imageUrl, order, isActive });

    // Validate required fields
    if (!title || !subtitle || !description || !imageUrl) {
      console.log('❌ Validation failed - missing required fields');
      return res.status(400).json({ error: 'Title, subtitle, description, and imageUrl are required' });
    }

    const slideData = {
      title,
      subtitle,
      description,
      imageUrl,
      order: order || 0,
      isActive: isActive !== false
    };

    console.log('💾 Creating slide with data:', slideData);

    const slide = new HeroSlide(slideData);
    await slide.save();
    
    console.log('✅ Hero slide created successfully:', slide._id);
    res.status(201).json({ message: 'Hero slide created successfully', slide });
  } catch (error) {
    console.error('❌ Error creating hero slide:', error);
    res.status(500).json({ error: 'Failed to create hero slide', details: error.message });
  }
});

// Test endpoint for debugging - No auth required
router.get('/test-hero-slides-url', (req, res) => {
  console.log('🔵 GET /test-hero-slides-url called');
  res.json({ 
    message: 'Hero slides URL endpoint is working!', 
    timestamp: new Date().toISOString(),
    routes: [
      'POST /api/content/admin/hero-slides-url',
      'PUT /api/content/admin/hero-slides-url/:id'
    ]
  });
});

// Update hero slide with Cloudinary URL (admin only) - New method
router.put('/admin/hero-slides-url/:id', auth, async (req, res) => {
  try {
    console.log(`🟡 PUT /admin/hero-slides-url/${req.params.id} called`);
    console.log('📝 Request body:', req.body);
    
    if (!isDatabaseReady()) {
      console.log('❌ Database not ready');
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const {
      title,
      subtitle,
      description,
      imageUrl,
      order,
      isActive
    } = req.body;

    console.log('📋 Update fields:', { title, subtitle, description, imageUrl, order, isActive });

    const slide = await HeroSlide.findById(req.params.id);
    if (!slide) {
      console.log('❌ Hero slide not found:', req.params.id);
      return res.status(404).json({ error: 'Hero slide not found' });
    }

    console.log('📄 Found existing slide:', slide.title);

    // Update fields if provided
    if (title !== undefined) slide.title = title;
    if (subtitle !== undefined) slide.subtitle = subtitle;
    if (description !== undefined) slide.description = description;
    if (imageUrl !== undefined) slide.imageUrl = imageUrl;
    if (order !== undefined) slide.order = order;
    if (isActive !== undefined) slide.isActive = isActive;

    await slide.save();
    console.log('✅ Hero slide updated successfully:', slide._id);
    res.json({ message: 'Hero slide updated successfully', slide });
  } catch (error) {
    console.error('❌ Error updating hero slide:', error);
    res.status(500).json({ error: 'Failed to update hero slide', details: error.message });
  }
});

// Delete hero slide (admin only)
router.delete('/admin/hero-slides/:id', auth, async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const slide = await HeroSlide.findByIdAndDelete(req.params.id);
    if (!slide) {
      return res.status(404).json({ error: 'Hero slide not found' });
    }

    res.json({ message: 'Hero slide deleted successfully' });
  } catch (error) {
    console.error('Error deleting hero slide:', error);
    res.status(500).json({ error: 'Failed to delete hero slide' });
  }
});

// Reorder hero slides (admin only)
router.patch('/admin/hero-slides/reorder', auth, async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const { slides } = req.body; // Array of { id, order }
    
    for (const slideData of slides) {
      await HeroSlide.findByIdAndUpdate(slideData.id, { order: slideData.order });
    }

    res.json({ message: 'Hero slides reordered successfully' });
  } catch (error) {
    console.error('Error reordering hero slides:', error);
    res.status(500).json({ error: 'Failed to reorder hero slides' });
  }
});

// Get all teachers (public)
router.get('/teachers', async (req, res) => {
  try {
    console.log('Fetching teachers...');
    
    // Ensure database connection
    const dbReady = await ensureDatabaseConnection();
    if (!dbReady) {
      console.log('Database connection failed, returning empty array');
      return res.json([]);
    }
    
    const teachers = await Teacher.find({ isActive: true })
      .select('-__v')
      .sort({ order: 1, name: 1 });
    
    console.log(`Returning ${teachers.length} active teachers`);
    res.json(teachers);
    
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

// Get all students (public)
router.get('/students', async (req, res) => {
  try {
    console.log('Fetching students...');
    
    // Ensure database connection
    const dbReady = await ensureDatabaseConnection();
    if (!dbReady) {
      console.log('Database connection failed, returning empty array');
      return res.json([]);
    }
    
    const students = await Student.find({ status: 'active' })
      .select('-__v')
      .sort({ lastName: 1, firstName: 1 });
    
    console.log(`Returning ${students.length} active students`);
    res.json(students);
    
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get teacher by ID (public)
router.get('/teachers/:id', async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const teacher = await Teacher.findById(req.params.id).select('-__v');
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    res.json(teacher);
  } catch (error) {
    console.error('Error fetching teacher:', error);
    res.status(500).json({ error: 'Failed to fetch teacher' });
  }
});

// Get student by ID (public)
router.get('/students/:id', async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const student = await Student.findById(req.params.id).select('-__v');
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// Admin endpoints for teachers
router.get('/admin/teachers', auth, async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const teachers = await Teacher.find()
      .select('-__v')
      .sort({ order: 1, name: 1 });
    
    res.json(teachers);
  } catch (error) {
    console.error('Error fetching admin teachers:', error);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

// Admin endpoints for students
router.get('/admin/students', auth, async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const students = await Student.find()
      .select('-__v')
      .sort({ lastName: 1, firstName: 1 });
    
    res.json(students);
  } catch (error) {
    console.error('Error fetching admin students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Create new teacher (admin only)
router.post('/admin/teachers', auth, upload.single('image'), async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const {
      name,
      position,
      expertise,
      description,
      rating,
      order,
      email,
      phone,
      department,
      qualifications,
      experience
    } = req.body;

    console.log('Teacher creation request:', {
      name,
      position, 
      expertise,
      email,
      phone,
      hasImage: !!req.file
    });

    // Validate required fields for teachers
    if (!name || !position || !expertise) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'name, position, and expertise are required for teachers'
      });
    }

    // Create teacher object with proper field mapping
    const teacherData = {
      name: name.trim(),
      position: position.trim(),
      expertise: expertise.trim(),
      description: description ? description.trim() : `Experienced ${position} specializing in ${expertise}`,
      rating: rating ? parseFloat(rating) : 5.0,
      order: order ? parseInt(order) : 0,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : '',
      isActive: true,
      // Optional fields - only include if provided and not empty
      email: email && email.trim() !== '' ? email.trim() : null,
      phone: phone ? phone.trim() : '',
      department: department ? department.trim() : (expertise ? expertise.trim() : ''),
      qualifications: qualifications ? qualifications.trim() : '',
      experience: experience ? experience.trim() : ''
    };

    // Upload image to Cloudinary if provided
    if (req.file) {
      try {
        teacherData.imageUrl = await uploadToCloudinary(req.file.buffer, req.file.originalname, 'hims-college/teachers');
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return res.status(500).json({ error: 'Failed to upload image' });
      }
    }

    console.log('Creating teacher with data:', teacherData);

    const teacher = new Teacher(teacherData);
    await teacher.save();
    
    console.log('Teacher created successfully:', teacher._id);
    
    res.status(201).json({ message: 'Teacher created successfully', teacher });
  } catch (error) {
    console.error('Error creating teacher:', error);
    res.status(500).json({ 
      error: 'Failed to create teacher',
      details: error.message 
    });
  }
});

// Update teacher (admin only)
router.put('/admin/teachers/:id', auth, upload.single('image'), async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const {
      name,
      position,
      expertise,
      description,
      rating,
      order,
      isActive,
      email,
      phone,
      department,
      qualifications,
      experience
    } = req.body;

    // Build update object with proper field handling
    const updateData = {};
    
    // Required fields - only update if provided
    if (name && name.trim()) updateData.name = name.trim();
    if (position && position.trim()) updateData.position = position.trim();
    if (expertise && expertise.trim()) updateData.expertise = expertise.trim();
    
    // Optional fields
    if (description !== undefined) {
      updateData.description = description.trim() || `Experienced ${position || 'educator'} specializing in ${expertise || 'their field'}`;
    }
    if (rating !== undefined) updateData.rating = rating ? parseFloat(rating) : 5;
    if (order !== undefined) updateData.order = order ? parseInt(order) : 0;
    if (isActive !== undefined) updateData.isActive = isActive !== false;
    
    // Handle email properly to avoid duplicate key errors
    if (email !== undefined) {
      updateData.email = email && email.trim() !== '' ? email.trim() : null;
    }
    
    // Other optional fields
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : '';
    if (department !== undefined) updateData.department = department ? department.trim() : '';
    if (qualifications !== undefined) updateData.qualifications = qualifications ? qualifications.trim() : '';
    if (experience !== undefined) updateData.experience = experience ? experience.trim() : '';

    // Add image URL if new image was uploaded
    if (req.file) {
      try {
        updateData.imageUrl = await uploadToCloudinary(req.file.buffer, req.file.originalname, 'hims-college/teachers');
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return res.status(500).json({ error: 'Failed to upload image' });
      }
    }
    
    const teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    res.json({ message: 'Teacher updated successfully', teacher });
  } catch (error) {
    console.error('Error updating teacher:', error);
    res.status(500).json({ 
      error: 'Failed to update teacher',
      details: error.message 
    });
  }
});

// Delete teacher (admin only)
router.delete('/admin/teachers/:id', auth, async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    res.status(500).json({ error: 'Failed to delete teacher' });
  }
});

// Create new student (admin only)
router.post('/admin/students', auth, upload.single('image'), async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    // Log the incoming request data for debugging
    console.log('Student creation request body:', req.body);
    console.log('Student creation request file:', req.file ? req.file.filename : 'No file');

    const {
      name,           // From admin form it sends 'name', not firstName/lastName
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      program,
      status,
      gpa,
      achievement,
      quote,
      awards
    } = req.body;

    // Handle name field that might come as a single field or separate firstName/lastName
    let finalFirstName = firstName;
    let finalLastName = lastName;
    
    if (name && name.trim()) {
      const nameParts = name.trim().split(' ');
      finalFirstName = nameParts[0] || 'Student';
      finalLastName = nameParts.slice(1).join(' ') || 'Student';
    } else if (firstName && firstName.trim()) {
      finalFirstName = firstName.trim();
      finalLastName = lastName ? lastName.trim() : 'Student';
    }

    // Generate email for showcase students if not provided
    let finalEmail = email;
    let isShowcaseStudent = false;
    if (!email || email.trim() === '') {
      // For showcase students, generate a unique dummy email
      const timestamp = Date.now();
      const nameSlug = (name || finalFirstName || 'student').toLowerCase().replace(/\s+/g, '');
      finalEmail = `showcase.${nameSlug}.${timestamp}@hims.showcase`;
      isShowcaseStudent = true;
      console.log('Generated showcase email:', finalEmail);
    }

    // Validate required fields - now with better validation
    if (!finalFirstName || !program) {
      console.log('Validation failed:', { finalFirstName, program });
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'name (or firstName) and program are required for students',
        received: {
          name: name || 'not provided',
          firstName: firstName || 'not provided', 
          program: program || 'not provided'
        }
      });
    }

    // Create student object with proper field mapping
    const studentData = {
      firstName: finalFirstName,
      lastName: finalLastName || 'Student',
      email: finalEmail.trim(),
      phone: phone ? phone.trim() : '',
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date('2000-01-01'),
      gender: gender || 'other',
      program: program.trim(),
      status: status || 'active',
      imageUrl: req.file ? `/uploads/${req.file.filename}` : '',
      // Additional fields for student showcase
      gpa: gpa || '',
      achievement: achievement || '',
      quote: quote || '',
      awards: awards ? (typeof awards === 'string' ? JSON.parse(awards) : awards) : [],
      isShowcaseStudent: isShowcaseStudent
    };

    // Upload image to Cloudinary if provided
    if (req.file) {
      try {
        studentData.imageUrl = await uploadToCloudinary(req.file.buffer, req.file.originalname, 'hims-college/students');
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return res.status(500).json({ error: 'Failed to upload image' });
      }
    }

    console.log('Creating student with data:', studentData);

    const student = new Student(studentData);
    await student.save();
    
    console.log('Student created successfully:', student._id);
    
    res.status(201).json({ message: 'Student created successfully', student });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ 
      error: 'Failed to create student',
      details: error.message 
    });
  }
});

// Update student (admin only)
router.put('/admin/students/:id', auth, upload.single('image'), async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: 'Database not available' });
    }

    // Log the incoming request data for debugging
    console.log('Student update request body:', req.body);
    console.log('Student update request file:', req.file ? req.file.filename : 'No file');

    const {
      name,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      program,
      status,
      gpa,
      achievement,
      quote,
      awards
    } = req.body;

    // Handle name field that might come as a single field or separate firstName/lastName
    let finalFirstName = firstName;
    let finalLastName = lastName;
    
    if (name && name.trim()) {
      const nameParts = name.trim().split(' ');
      finalFirstName = nameParts[0] || 'Student';
      finalLastName = nameParts.slice(1).join(' ') || 'Student';
    } else if (firstName && firstName.trim()) {
      finalFirstName = firstName.trim();
      finalLastName = lastName ? lastName.trim() : 'Student';
    }

    // Build update object - only update provided fields
    const updateData = {};
    
    if (finalFirstName) updateData.firstName = finalFirstName;
    if (finalLastName) updateData.lastName = finalLastName;
    if (email) updateData.email = email.trim();
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : '';
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
    if (gender) updateData.gender = gender;
    if (program) updateData.program = program.trim();
    if (status) updateData.status = status;
    if (gpa !== undefined) updateData.gpa = gpa;
    if (achievement !== undefined) updateData.achievement = achievement;
    if (quote !== undefined) updateData.quote = quote;
    if (awards !== undefined) {
      updateData.awards = awards ? (typeof awards === 'string' ? JSON.parse(awards) : awards) : [];
    }

    // Add image URL if new image was uploaded
    if (req.file) {
      try {
        updateData.imageUrl = await uploadToCloudinary(req.file.buffer, req.file.originalname, 'hims-college/students');
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return res.status(500).json({ error: 'Failed to upload image' });
      }
    }

    console.log('Updating student with data:', updateData);
    
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    console.log('Student updated successfully:', student._id);
    
    res.json({ message: 'Student updated successfully', student });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ 
      error: 'Failed to update student',
      details: error.message 
    });
  }
});

// Delete student (admin only)
router.delete('/admin/students/:id', auth, async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// Get teacher statistics (admin only)
router.get('/admin/teachers/stats', auth, async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: 'Database not available' });
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
      departmentStats
    });
  } catch (error) {
    console.error('Error fetching teacher statistics:', error);
    res.status(500).json({ error: 'Failed to fetch teacher statistics' });
  }
});

// Get student statistics (admin only)
router.get('/admin/students/stats', auth, async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ status: 'active' });
    const inactiveStudents = await Student.countDocuments({ status: 'inactive' });
    const graduatedStudents = await Student.countDocuments({ status: 'graduated' });
    
    const programStats = await Student.aggregate([
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
      total: totalStudents,
      active: activeStudents,
      inactive: inactiveStudents,
      graduated: graduatedStudents,
      programStats
    });
  } catch (error) {
    console.error('Error fetching student statistics:', error);
    res.status(500).json({ error: 'Failed to fetch student statistics' });
  }
});

module.exports = router; 