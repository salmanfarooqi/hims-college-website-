const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
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
    required: true,
    trim: true
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
  department: {
    type: String,
    required: true,
    trim: true
  },
  specialization: {
    type: String,
    required: true,
    trim: true
  },
  hireDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'retired'],
    default: 'active'
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  education: {
    institution: String,
    degree: String,
    yearCompleted: Number,
    field: String
  },
  experience: {
    yearsOfExperience: Number,
    previousInstitutions: [String]
  }
}, {
  timestamps: true
});

// Create index for efficient queries
teacherSchema.index({ email: 1 });
teacherSchema.index({ department: 1 });
teacherSchema.index({ status: 1 });

module.exports = mongoose.model('Teacher', teacherSchema); 