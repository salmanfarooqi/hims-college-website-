const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  program: {
    type: String,
    required: true,
    enum: ['FSC Pre-Medical', 'FSC Pre-Engineering', 'ICS Computer Science', 'Shining Star'],
    trim: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'graduated'],
    default: 'active'
  },
  imageUrl: {
    type: String,
    default: ''
  },
  // Simplified fields for shining stars
  year: {
    type: String,
    trim: true,
    default: new Date().getFullYear().toString()
  },
  profession: {
    type: String,
    trim: true,
    default: ''
  },
  institute: {
    type: String,
    trim: true,
    default: ''
  },
  // Flag to identify showcase students vs regular applicants
  isShowcaseStudent: {
    type: Boolean,
    default: false
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    email: String
  }
}, {
  timestamps: true
});

// Create indexes for efficient queries (email index is automatically created by unique: true)
studentSchema.index({ program: 1 });
studentSchema.index({ status: 1 });
studentSchema.index({ year: 1 });

module.exports = mongoose.model('Student', studentSchema); 