const express = require('express');
const router = express.Router();
const HeroSlide = require('../models/HeroSlide');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

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

// Get all active hero slides (public)
router.get('/hero-slides', async (req, res) => {
  try {
    const slides = await HeroSlide.find({ isActive: true })
      .sort({ order: 1 })
      .select('-__v');
    
    res.json(slides);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hero slides' });
  }
});

// Get all hero slides (admin only)
router.get('/admin/hero-slides', auth, async (req, res) => {
  try {
    const slides = await HeroSlide.find()
      .sort({ order: 1 });
    
    res.json(slides);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hero slides' });
  }
});

// Create new hero slide (admin only)
router.post('/admin/hero-slides', auth, upload.single('image'), async (req, res) => {
  try {
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
    res.status(500).json({ error: 'Failed to create hero slide' });
  }
});

// Update hero slide (admin only)
router.put('/admin/hero-slides/:id', auth, upload.single('image'), async (req, res) => {
  try {
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
    res.status(500).json({ error: 'Failed to update hero slide' });
  }
});

// Delete hero slide (admin only)
router.delete('/admin/hero-slides/:id', auth, async (req, res) => {
  try {
    const slide = await HeroSlide.findByIdAndDelete(req.params.id);
    if (!slide) {
      return res.status(404).json({ error: 'Hero slide not found' });
    }

    res.json({ message: 'Hero slide deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete hero slide' });
  }
});

// Reorder hero slides (admin only)
router.patch('/admin/hero-slides/reorder', auth, async (req, res) => {
  try {
    const { slides } = req.body; // Array of { id, order }
    
    for (const slideData of slides) {
      await HeroSlide.findByIdAndUpdate(slideData.id, { order: slideData.order });
    }

    res.json({ message: 'Hero slides reordered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reorder hero slides' });
  }
});

module.exports = router; 