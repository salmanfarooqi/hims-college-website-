const mongoose = require('mongoose');

require('dotenv').config({ path: './config.env' });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://salmanfarooqi1272001:zEGciWrm7uBCYTLt@cluster0.gitehdr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const testConnection = async () => {
  try {
    console.log('Testing MongoDB connection...');
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
    
    console.log('Connection successful!');
    
    // Test a simple operation
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('Connection failed:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

testConnection(); 