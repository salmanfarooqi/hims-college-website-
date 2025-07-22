const mongoose = require('mongoose');

const heroSlideSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  buttonText: {
    type: String,
    trim: true
  },
  buttonLink: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create index for efficient queries
heroSlideSchema.index({ order: 1 });
heroSlideSchema.index({ isActive: 1 });

module.exports = mongoose.model('HeroSlide', heroSlideSchema); 