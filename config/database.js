const mongoose = require('mongoose');

// Load environment variables
try {
  require('dotenv').config({ path: './config.env' });
} catch (error) {
  console.log('config.env not found, using default MongoDB URI');
}

const MONGODB_URI = 'mongodb+srv://salmanfarooqi1272001:zEGciWrm7uBCYTLt@cluster0.gitehdr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Don't exit process on Vercel, just log the error
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

module.exports = { connectDB, mongoose }; 