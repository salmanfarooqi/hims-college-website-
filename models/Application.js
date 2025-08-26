const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  // Personal Information
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
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: false,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: false,
    trim: true
  },
  guardianPhone: {
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
  
  // Academic Information
  class: {
    type: String,
    enum: ['1st Year', '2nd Year'],
    required: true
  },
  group: {
    type: String,
    enum: ['FSC Pre-Medical', 'FSC Pre-Engineering', 'FSC Pre-Computer Science', 'Arts'],
    required: true
  },
  
  // Address Information
  address: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: false,
    trim: true
  },
  state: {
    type: String,
    required: false,
    trim: true
  },
  zipCode: {
    type: String,
    required: false,
    trim: true
  },
  
  // Education Information
  education: {
    metric: {
      year: {
        type: String,
        required: true,
        trim: true
      },
      rollNumber: {
        type: String,
        required: true,
        trim: true
      },
      marks: {
        type: String,
        required: true,
        trim: true
      },
      school: {
        type: String,
        required: true,
        trim: true
      }
    }
  },
  
  // Document Uploads
  documents: {
    dmcMetric: {
      type: String,
      required: true
    },
    passportPhoto: {
      type: String,
      required: true
    },
    fatherCNIC: {
      type: String,
      required: true
    },
    migrationCertificate: {
      type: String,
      required: false // Optional
    }
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
  
  // Application Status
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
applicationSchema.index({ transactionId: 1 }, { unique: true });
applicationSchema.index({ status: 1 });
applicationSchema.index({ group: 1 });
applicationSchema.index({ class: 1 });
applicationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema); 