const mongoose = require('mongoose');

// Load environment variables
try {
  require('dotenv').config({ path: './config.env' });
} catch (error) {
  console.log('config.env not found, using default MongoDB URI');
}

// Try different connection string formats
const MONGODB_URI = 'mongodb+srv://salmanfarooqi1272001:zEGciWrm7uBCYTLt@cluster0.gitehdr.mongodb.net/hims-college?retryWrites=true&w=majority';

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('Already connected to MongoDB');
    return;
  }

  try {
    console.log('Attempting to connect to MongoDB...');
    
    // Disable mongoose buffering and set strict mode
    mongoose.set('bufferCommands', false);
    mongoose.set('strictQuery', false);
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 60000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 60000,
      maxPoolSize: 1,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      retryReads: true,
      w: 'majority',
      readPreference: 'primary'
    });
    
    isConnected = true;
    console.log('MongoDB connected successfully');
    
    // Test the connection with a simple operation
    try {
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      console.log('Available collections:', collections.map(c => c.name));
    } catch (testError) {
      console.error('Connection test failed:', testError);
    }
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      isConnected = true;
    });
    
  } catch (error) {
    console.error('MongoDB connection error:', error);
    isConnected = false;
    
    // Try alternative connection if first fails
    if (error.code === 'ETIMEOUT' || error.message.includes('queryTxt')) {
      console.log('DNS timeout detected, trying alternative connection...');
      try {
        const altUri = 'mongodb+srv://salmanfarooqi1272001:zEGciWrm7uBCYTLt@cluster0.gitehdr.mongodb.net/hims-college?retryWrites=true&w=majority&directConnection=true';
        await mongoose.connect(altUri, {
          serverSelectionTimeoutMS: 30000,
          socketTimeoutMS: 30000,
          connectTimeoutMS: 30000
        });
        isConnected = true;
        console.log('MongoDB connected with alternative method');
      } catch (altError) {
        console.error('Alternative connection also failed:', altError);
      }
    }
    
    // Don't exit process on Vercel, just log the error
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

const getConnectionStatus = () => {
  return isConnected && mongoose.connection.readyState === 1;
};

module.exports = { connectDB, mongoose, getConnectionStatus }; 