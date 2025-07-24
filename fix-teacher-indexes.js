const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    const conn = await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: 'majority'
    });
    
    console.log('✅ Connected to MongoDB successfully!');
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

const fixTeacherIndexes = async () => {
  try {
    console.log('🔧 Starting Teacher indexes fix...');
    
    // Connect to database
    await connectDB();
    
    // Get the teachers collection
    const db = mongoose.connection.db;
    const collection = db.collection('teachers');
    
    console.log('📋 Checking existing indexes...');
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));
    
    // Check if there's a unique index on email
    const emailIndex = indexes.find(idx => 
      (idx.key.email === 1 || idx.key.email === -1) && idx.unique === true
    );
    
    if (emailIndex) {
      console.log('🗑️ Dropping existing unique email index:', emailIndex.name);
      await collection.dropIndex(emailIndex.name);
      console.log('✅ Old index dropped successfully');
    }
    
    // Update all documents with empty string emails to null
    console.log('🔄 Updating empty email strings to null...');
    const updateResult = await collection.updateMany(
      { email: '' },
      { $set: { email: null } }
    );
    console.log(`✅ Updated ${updateResult.modifiedCount} documents`);
    
    // Create new sparse unique index
    console.log('🔨 Creating new sparse unique index on email...');
    await collection.createIndex(
      { email: 1 }, 
      { 
        unique: true, 
        sparse: true, 
        name: 'email_1_sparse_unique' 
      }
    );
    console.log('✅ New sparse unique index created successfully');
    
    // Verify the fix by checking indexes again
    console.log('🔍 Verifying new indexes...');
    const newIndexes = await collection.indexes();
    console.log('Updated indexes:', newIndexes.map(idx => ({ 
      name: idx.name, 
      key: idx.key, 
      unique: idx.unique || false,
      sparse: idx.sparse || false
    })));
    
    console.log('🎉 Teacher indexes fix completed successfully!');
    console.log('');
    console.log('📌 Summary:');
    console.log('   ✅ Old unique email index removed');
    console.log('   ✅ Empty email strings converted to null');
    console.log('   ✅ New sparse unique email index created');
    console.log('   ✅ Teachers with empty emails can now be created without conflicts');
    
  } catch (error) {
    console.error('❌ Error fixing teacher indexes:', error);
    
    if (error.code === 11000) {
      console.log('');
      console.log('🔧 Duplicate key error detected. This might mean there are still duplicate emails.');
      console.log('   Please check your data and remove any duplicate email addresses manually.');
    }
  } finally {
    await mongoose.connection.close();
    console.log('📊 Database connection closed');
    process.exit(0);
  }
};

// Run the fix
fixTeacherIndexes(); 