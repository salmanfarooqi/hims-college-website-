const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://alikhaninfo125:0Iozd8UY0NdEBsg3@cluster0-shard-00-00.dz7tc.mongodb.net:27017,cluster0-shard-00-01.dz7tc.mongodb.net:27017,cluster0-shard-00-02.dz7tc.mongodb.net:27017/hims-college?ssl=true&replicaSet=atlas-14b8sh-shard-0&authSource=admin&retryWrites=true&w=majority', {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      maxPoolSize: 1,
      bufferCommands: false
    });
    console.log('✅ Connected to MongoDB successfully!');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    if (error.message.includes('IP that isn\'t whitelisted')) {
      console.log('\n🔧 SOLUTION: You need to whitelist your IP address in MongoDB Atlas');
      console.log('📋 Steps to fix:');
      console.log('1. Go to MongoDB Atlas dashboard');
      console.log('2. Navigate to Network Access');
      console.log('3. Click "Add IP Address"');
      console.log('4. Add your current IP or use "Allow Access from Anywhere" (0.0.0.0/0)');
      console.log('5. Save the changes');
      console.log('\n💡 For now, the fallback authentication system will work');
      console.log('   Login with: hims@gmail.com / hims123');
    }
    
    // Don't exit the process, let the application continue with fallback
    console.log('\n🔄 Continuing with fallback authentication system...');
  }
};

module.exports = connectDB; 