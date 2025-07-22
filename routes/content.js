const express = require('express');
const router = express.Router();
const HeroSlide = require('../models/HeroSlide');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'hero-slide-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Fallback hero slides data
const fallbackSlides = [
  {
    title: 'Welcome to HIMS College',
    subtitle: 'Excellence in Education',
    description: 'Join us for a world-class education experience with state-of-the-art facilities and expert faculty.',
    imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9a1?w=800',
    buttonText: 'Apply Now',
    buttonLink: '/apply',
    order: 1,
    isActive: true
  },
  {
    title: 'Modern Learning Environment',
    subtitle: 'Cutting-edge Technology',
    description: 'Experience learning with the latest technology and innovative teaching methods.',
    imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800',
    buttonText: 'Learn More',
    buttonLink: '/programs',
    order: 2,
    isActive: true
  },
  {
    title: 'Expert Faculty',
    subtitle: 'Industry Professionals',
    description: 'Learn from experienced professionals who bring real-world expertise to the classroom.',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    buttonText: 'Meet Our Faculty',
    buttonLink: '/faculty',
    order: 3,
    isActive: true
  }
];

// Helper function to check if database is ready
const isDatabaseReady = () => {
  return mongoose.connection.readyState === 1;
};

// Get all active hero slides (public)
router.get('/hero-slides', async (req, res) => {
  try {
    console.log('Fetching hero slides...');
    
    // Check if database is ready
    if (!isDatabaseReady()) {
      console.log('Database not ready, returning fallback data');
      return res.json(fallbackSlides);
    }
    
    // Use a timeout promise to handle database operations
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timed out')), 5000);
    });
    
    const dbOperation = async () => {
      // Check if we have any slides, if not create sample data
      const slideCount = await HeroSlide.countDocuments();
      console.log(`Found ${slideCount} existing slides`);
      
      if (slideCount === 0) {
        console.log('No hero slides found, creating sample data...');
        
        // Create sample hero slides
        const sampleSlides = [
          {
            title: 'Welcome to HIMS College',
            subtitle: 'Excellence in Education',
            description: 'Join us for a world-class education experience with state-of-the-art facilities and expert faculty.',
            imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9a1?w=800',
            buttonText: 'Apply Now',
            buttonLink: '/apply',
            order: 1,
            isActive: true
          },
          {
            title: 'Modern Learning Environment',
            subtitle: 'Cutting-edge Technology',
            description: 'Experience learning with the latest technology and innovative teaching methods.',
            imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800',
            buttonText: 'Learn More',
            buttonLink: '/programs',
            order: 2,
            isActive: true
          },
          {
            title: 'Expert Faculty',
            subtitle: 'Industry Professionals',
            description: 'Learn from experienced professionals who bring real-world expertise to the classroom.',
            imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
            buttonText: 'Meet Our Faculty',
            buttonLink: '/faculty',
            order: 3,
            isActive: true
          }
        ];

        await HeroSlide.insertMany(sampleSlides);
        console.log('Sample hero slides created successfully');
      }

      const slides = await HeroSlide.find({ isActive: true })
        .sort({ order: 1 })
        .select('-__v');
      
      console.log(`Returning ${slides.length} active hero slides`);
      return slides;
    };
    
    // Race between database operation and timeout
    const slides = await Promise.race([dbOperation(), timeoutPromise]);
    res.json(slides);
    
  } catch (error) {
    console.error('Error fetching hero slides:', error);
    
    // Return fallback data if database fails
    console.log('Returning fallback hero slides due to database error');
    res.json(fallbackSlides);
  }
});

// Get all hero slides (admin only)
router.get('/admin/hero-slides', auth, async (req, res) => {
  try {
    if (!isDatabaseReady()) {
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
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const {
      title,
      subtitle,
      description,
      buttonText,
      buttonLink,
      order,
      isActive
    } = req.body;

    const slide = new HeroSlide({
      title,
      subtitle,
      description,
      imageUrl: req.file ? req.file.path : '',
      buttonText,
      buttonLink,
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
      buttonText,
      buttonLink,
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
    slide.buttonText = buttonText || slide.buttonText;
    slide.buttonLink = buttonLink || slide.buttonLink;
    slide.order = order !== undefined ? order : slide.order;
    slide.isActive = isActive !== undefined ? isActive : slide.isActive;

    if (req.file) {
      slide.imageUrl = req.file.path;
    }

    await slide.save();
    res.json({ message: 'Hero slide updated successfully', slide });
  } catch (error) {
    console.error('Error updating hero slide:', error);
    res.status(500).json({ error: 'Failed to update hero slide' });
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

module.exports = router; 