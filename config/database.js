const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

const MONGODB_URI = 'mongodb+srv://salmanfarooqi1272001:zEGciWrm7uBCYTLt@cluster0.gitehdr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = { connectDB, mongoose }; 