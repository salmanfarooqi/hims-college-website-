const mongoose = require('mongoose');
const config = require('./app-config');

// Connection options from config file
const connectionOptions = config.DB_OPTIONS;

let isConnected = false;

const connectDB = async (retries = 3) => {
  if (isConnected) {
    console.log('✅ Using existing MongoDB connection');
    return;
  }

  try {
    const MONGODB_URI = config.MONGODB_URI;
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not defined in config');
    }

    console.log('🔄 Attempting to connect to MongoDB...');
    
    const conn = await mongoose.connect(MONGODB_URI, connectionOptions);
    
    isConnected = true;
    console.log('✅ Connected to MongoDB successfully!');
    console.log(`📍 Database: ${conn.connection.name}`);
    console.log(`🌐 Host: ${conn.connection.host}:${conn.connection.port}`);
    
    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
      isConnected = true;
    });

    return conn;
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    isConnected = false;
    
    // Provide specific error guidance
    if (error.message.includes('IP') || error.message.includes('whitelist')) {
      console.log('\n🔧 IP WHITELIST ISSUE:');
      console.log('1. Go to MongoDB Atlas → Network Access');
      console.log('2. Add your current IP address');
      console.log('3. Or use 0.0.0.0/0 for development (not recommended for production)');
    } else if (error.message.includes('authentication')) {
      console.log('\n🔧 AUTHENTICATION ISSUE:');
      console.log('1. Check your username and password in MONGODB_URI');
      console.log('2. Ensure the database user has proper permissions');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('timeout')) {
      console.log('\n🔧 NETWORK ISSUE:');
      console.log('1. Check your internet connection');
      console.log('2. Verify the cluster URL is correct');
      console.log('3. Try using a VPN if behind a firewall');
    }
    
    if (retries > 0) {
      console.log(`🔄 Retrying connection... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB(retries - 1);
    }
    
    console.log('\n🔄 Continuing with fallback authentication system...');
    console.log('⚠️ Some features may not work without database connection');
    
    // Don't throw error, let app continue with fallback
    return null;
  }
};

// Graceful shutdown
const closeConnection = async () => {
  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
    console.log('✅ MongoDB connection closed');
  }
};

module.exports = { connectDB, closeConnection, isConnected: () => isConnected }; 