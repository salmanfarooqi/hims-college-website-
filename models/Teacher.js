const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  expertise: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  order: {
    type: Number,
    default: 0
  },
  imageUrl: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Optional additional fields for more details
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: null,  // Changed from '' to null to avoid duplicate key issues
    sparse: true    // Only create index for non-null values
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  department: {
    type: String,
    trim: true,
    default: ''
  },
  qualifications: {
    type: String,
    trim: true,
    default: ''
  },
  experience: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// Create indexes for efficient queries
teacherSchema.index({ order: 1 });
teacherSchema.index({ isActive: 1 });
teacherSchema.index({ position: 1 });
// Sparse index on email - only indexes non-null values to avoid duplicate key errors
teacherSchema.index({ email: 1 }, { sparse: true, unique: true });

// Pre-save middleware to handle empty email strings
teacherSchema.pre('save', function(next) {
  // Convert empty string email to null to avoid duplicate key errors
  if (this.email === '') {
    this.email = null;
  }
  next();
});

module.exports = mongoose.model('Teacher', teacherSchema); 