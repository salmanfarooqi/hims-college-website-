const mongoose = require('mongoose');
const { connectDB, getConnectionStatus } = require('./config/database');

console.log('🔧 Enhanced Database Connection Test');
console.log('===================================\n');

const testConnection = async () => {
  try {
    console.log('🔄 Testing database connection...');
    
    // Test the connection function
    await connectDB();
    
    // Check connection status
    const isConnected = getConnectionStatus();
    
    if (isConnected) {
      console.log('\n✅ SUCCESS: Database connection established!');
      console.log('📊 You can now use the full application features');
      console.log('🔐 Admin login: hims@gmail.com / hims123');
      
      // Test basic operations
      try {
        const Admin = require('./models/Admin');
        const adminCount = await Admin.countDocuments();
        console.log(`👥 Admin accounts in database: ${adminCount}`);
        
        if (adminCount === 0) {
          console.log('💡 No admin accounts found. You can create one using:');
          console.log('   node setup-admin.js');
        }
        
      } catch (opError) {
        console.log('⚠️ Could not test database operations:', opError.message);
      }
      
    } else {
      console.log('\n❌ FAILED: Database connection unsuccessful');
      console.log('💡 Using fallback authentication system');
      console.log('🔐 Login with: hims@gmail.com / hims123');
      
      console.log('\n🔧 Troubleshooting steps:');
      console.log('1. Check your internet connection');
      console.log('2. Verify MongoDB Atlas cluster is running');
      console.log('3. Update connection string in config.env');
      console.log('4. Check if your IP is whitelisted in Atlas');
      console.log('5. Try using a local MongoDB instance');
    }
    
  } catch (error) {
    console.error('\n💥 Test failed with error:', error.message);
  } finally {
    // Clean up
    try {
      await mongoose.disconnect();
      console.log('\n🔌 Database connection closed');
    } catch (e) {
      // Ignore disconnect errors
    }
    process.exit(0);
  }
};

testConnection(); 