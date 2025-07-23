const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

console.log('🔧 Database Connection Diagnostic Tool');
console.log('=====================================\n');

// Test different connection scenarios
const testConnections = async () => {
  const connections = [
    {
      name: 'Current Atlas Cluster',
      uri: 'mongodb+srv://salmanfarooqi1272001:zEGciWrm7uBCYTLt@cluster0.gitehdr.mongodb.net/hims-college?retryWrites=true&w=majority'
    },
    {
      name: 'Atlas Cluster (Alternative Format)',
      uri: 'mongodb+srv://salmanfarooqi1272001:zEGciWrm7uBCYTLt@cluster0.gitehdr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
    },
    {
      name: 'Local MongoDB (if installed)',
      uri: 'mongodb://localhost:27017/hims-college'
    }
  ];

  for (const connection of connections) {
    console.log(`\n🔍 Testing: ${connection.name}`);
    console.log(`   URI: ${connection.uri.replace(/\/\/.*@/, '//***:***@')}`);
    
    try {
      await mongoose.connect(connection.uri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 10000,
        connectTimeoutMS: 10000
      });
      
      console.log('   ✅ Connection successful!');
      
      // Test database operations
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      console.log(`   📊 Collections found: ${collections.length}`);
      
      await mongoose.disconnect();
      
    } catch (error) {
      console.log(`   ❌ Connection failed: ${error.message}`);
      if (error.code) {
        console.log(`   🔍 Error code: ${error.code}`);
      }
    }
  }
};

// Update config.env with new connection string
const updateConfig = (newUri) => {
  try {
    const configPath = path.join(__dirname, 'config.env');
    let config = fs.readFileSync(configPath, 'utf8');
    
    // Update MONGODB_URI
    const newConfig = config.replace(
      /MONGODB_URI=.*/,
      `MONGODB_URI=${newUri}`
    );
    
    fs.writeFileSync(configPath, newConfig);
    console.log('\n✅ Updated config.env with new connection string');
    console.log('   Please restart your server to use the new configuration');
    
  } catch (error) {
    console.error('❌ Failed to update config.env:', error.message);
  }
};

// Main execution
const main = async () => {
  await testConnections();
  
  console.log('\n📋 Recommendations:');
  console.log('1. Check your MongoDB Atlas dashboard for the correct connection string');
  console.log('2. Ensure your IP address is whitelisted in Atlas');
  console.log('3. Verify your Atlas cluster is running');
  console.log('4. Consider using a local MongoDB instance for development');
  console.log('5. Update the MONGODB_URI in config.env with the correct connection string');
  
  console.log('\n💡 To update your connection string, edit config.env and change:');
  console.log('   MONGODB_URI=your_new_connection_string_here');
  
  console.log('\n🔧 Current fallback behavior:');
  console.log('   - System will use hardcoded admin when database is unavailable');
  console.log('   - Login with: hims@gmail.com / hims123');
  console.log('   - This is a temporary solution until database is fixed');
};

main().catch(console.error); 