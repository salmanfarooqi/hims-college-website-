const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
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
  fatherName: {
    type: String,
    required: false,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true
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
  program: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  zipCode: {
    type: String,
    required: true,
    trim: true
  },
  previousSchool: {
    type: String,
    required: true,
    trim: true
  },
  previousGrade: {
    type: String,
    required: true,
    trim: true
  },
  // Payment Information
  paymentAmount: {
    type: String,
    required: true,
    default: '200'
  },
  easypaisaNumber: {
    type: String,
    required: true,
    trim: true
  },
  transactionId: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  transactionReceipt: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  },
  applicationDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create unique indexes for efficient queries and prevent duplicates
applicationSchema.index({ email: 1 }, { unique: true });
applicationSchema.index({ transactionId: 1 }, { unique: true });
applicationSchema.index({ status: 1 });
applicationSchema.index({ program: 1 });
applicationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema); 