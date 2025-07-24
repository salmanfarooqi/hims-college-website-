const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://salmanfarooqi1272001:zEGciWrm7uBCYTLt@cluster0.gitehdr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      maxPoolSize: 1,
      bufferCommands: true
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