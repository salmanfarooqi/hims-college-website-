const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadImage, deleteFile } = require('../utils/cloudinary');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
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
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Import models
const HeroSlide = require('../models/HeroSlide');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');

// ===== UPLOAD ENDPOINT =====

// Upload image endpoint
router.post('/upload', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const uploadResult = await uploadImage(req.file, 'hims-college/uploads');
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      url: uploadResult.url,
      publicId: uploadResult.public_id,
      width: uploadResult.width,
      height: uploadResult.height
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// ===== HERO SLIDES =====

// Get all hero slides (public)
router.get('/hero-slides', async (req, res) => {
  try {
    const slides = await HeroSlide.findAll({
      where: { isActive: true },
      order: [['order', 'ASC']]
    });
    res.json(slides);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hero slides' });
  }
});

// Get all hero slides (admin)
router.get('/admin/hero-slides', auth, async (req, res) => {
  try {
    const slides = await HeroSlide.findAll({
      order: [['order', 'ASC']]
    });
    res.json(slides);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hero slides' });
  }
});

// Create hero slide
router.post('/admin/hero-slides', auth, upload.single('image'), async (req, res) => {
  try {
    const { title, subtitle, description, ctaText, ctaLink, order } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const uploadResult = await uploadImage(req.file, 'hims-college/hero-slides');
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    const slide = await HeroSlide.create({
      title,
      subtitle,
      description,
      imageUrl: uploadResult.url,
      ctaText: ctaText || 'Learn More',
      ctaLink: ctaLink || '/apply',
      order: order || 0
    });

    res.status(201).json(slide);
  } catch (error) {
    console.error('Error creating hero slide:', error);
    res.status(500).json({ error: 'Failed to create hero slide' });
  }
});

// Update hero slide
router.put('/admin/hero-slides/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, description, ctaText, ctaLink, order, isActive } = req.body;
    
    const slide = await HeroSlide.findByPk(id);
    if (!slide) {
      return res.status(404).json({ error: 'Hero slide not found' });
    }

    const updateData = {
      title,
      subtitle,
      description,
      ctaText,
      ctaLink,
      order,
      isActive
    };

    // If new image is uploaded
    if (req.file) {
      const uploadResult = await uploadImage(req.file, 'hims-college/hero-slides');
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      // Delete old image from Cloudinary if it exists
      if (slide.imageUrl && slide.imageUrl.includes('cloudinary')) {
        try {
          const publicId = slide.imageUrl.split('/').pop().split('.')[0];
          await deleteFile(`hims-college/hero-slides/${publicId}`);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }
      
      updateData.imageUrl = uploadResult.url;
    }

    await slide.update(updateData);
    res.json(slide);
  } catch (error) {
    console.error('Error updating hero slide:', error);
    res.status(500).json({ error: 'Failed to update hero slide' });
  }
});

// Delete hero slide
router.delete('/admin/hero-slides/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const slide = await HeroSlide.findByPk(id);
    
    if (!slide) {
      return res.status(404).json({ error: 'Hero slide not found' });
    }

    // Delete image from Cloudinary if it exists
    if (slide.imageUrl && slide.imageUrl.includes('cloudinary')) {
      try {
        const publicId = slide.imageUrl.split('/').pop().split('.')[0];
        await deleteFile(`hims-college/hero-slides/${publicId}`);
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }

    await slide.destroy();
    res.json({ message: 'Hero slide deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete hero slide' });
  }
});

// ===== TEACHERS =====

// Get all teachers (public)
router.get('/teachers', async (req, res) => {
  try {
    const teachers = await Teacher.findAll({
      where: { isActive: true },
      order: [['order', 'ASC']]
    });
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

// Get all teachers (admin)
router.get('/admin/teachers', auth, async (req, res) => {
  try {
    const teachers = await Teacher.findAll({
      order: [['order', 'ASC']]
    });
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

// Create teacher
router.post('/admin/teachers', auth, upload.single('image'), async (req, res) => {
  try {
    const { name, position, expertise, description, rating, order } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const uploadResult = await uploadImage(req.file, 'hims-college/teachers');
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    const teacher = await Teacher.create({
      name,
      position,
      expertise,
      description,
      rating: rating || 4.5,
      imageUrl: uploadResult.url,
      order: order || 0
    });

    res.status(201).json(teacher);
  } catch (error) {
    console.error('Error creating teacher:', error);
    res.status(500).json({ error: 'Failed to create teacher' });
  }
});

// Update teacher
router.put('/admin/teachers/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, position, expertise, description, rating, order, isActive } = req.body;
    
    const teacher = await Teacher.findByPk(id);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const updateData = {
      name,
      position,
      expertise,
      description,
      rating,
      order,
      isActive
    };

    // If new image is uploaded
    if (req.file) {
      const uploadResult = await uploadImage(req.file, 'hims-college/teachers');
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      // Delete old image from Cloudinary if it exists
      if (teacher.imageUrl && teacher.imageUrl.includes('cloudinary')) {
        try {
          const publicId = teacher.imageUrl.split('/').pop().split('.')[0];
          await deleteFile(`hims-college/teachers/${publicId}`);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }
      
      updateData.imageUrl = uploadResult.url;
    }

    await teacher.update(updateData);
    res.json(teacher);
  } catch (error) {
    console.error('Error updating teacher:', error);
    res.status(500).json({ error: 'Failed to update teacher' });
  }
});

// Delete teacher
router.delete('/admin/teachers/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const teacher = await Teacher.findByPk(id);
    
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Delete image from Cloudinary if it exists
    if (teacher.imageUrl && teacher.imageUrl.includes('cloudinary')) {
      try {
        const publicId = teacher.imageUrl.split('/').pop().split('.')[0];
        await deleteFile(`hims-college/teachers/${publicId}`);
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }

    await teacher.destroy();
    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete teacher' });
  }
});

// ===== STUDENTS =====

// Get all students (public)
router.get('/students', async (req, res) => {
  try {
    const students = await Student.findAll({
      where: { isActive: true },
      order: [['order', 'ASC']]
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get all students (admin)
router.get('/admin/students', auth, async (req, res) => {
  try {
    const students = await Student.findAll({
      order: [['order', 'ASC']]
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Create student
router.post('/admin/students', auth, upload.single('image'), async (req, res) => {
  try {
    const { name, program, achievement, gpa, quote, awards, order } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const uploadResult = await uploadImage(req.file, 'hims-college/students');
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    const student = await Student.create({
      name,
      program,
      achievement,
      gpa,
      quote,
      awards: awards ? JSON.parse(awards) : [],
      imageUrl: uploadResult.url,
      order: order || 0
    });

    res.status(201).json(student);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// Update student
router.put('/admin/students/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, program, achievement, gpa, quote, awards, order, isActive } = req.body;
    
    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const updateData = {
      name,
      program,
      achievement,
      gpa,
      quote,
      awards: awards ? JSON.parse(awards) : [],
      order,
      isActive
    };

    // If new image is uploaded
    if (req.file) {
      const uploadResult = await uploadImage(req.file, 'hims-college/students');
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      // Delete old image from Cloudinary if it exists
      if (student.imageUrl && student.imageUrl.includes('cloudinary')) {
        try {
          const publicId = student.imageUrl.split('/').pop().split('.')[0];
          await deleteFile(`hims-college/students/${publicId}`);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }
      
      updateData.imageUrl = uploadResult.url;
    }

    await student.update(updateData);
    res.json(student);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Delete student
router.delete('/admin/students/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id);
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Delete image from Cloudinary if it exists
    if (student.imageUrl && student.imageUrl.includes('cloudinary')) {
      try {
        const publicId = student.imageUrl.split('/').pop().split('.')[0];
        await deleteFile(`hims-college/students/${publicId}`);
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }

    await student.destroy();
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

module.exports = router; 