const mongoose = require('mongoose');
const { connectDB } = require('./config/database');
const Teacher = require('./models/Teacher');

// Simple script to delete all teachers
const deleteAllTeachers = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    
    console.log('🗑️ Deleting all teachers...');
    
    // Delete all teachers using MongoDB query
    const result = await Teacher.deleteMany({});
    
    console.log(`✅ Successfully deleted ${result.deletedCount} teachers`);
    
    // Verify deletion
    const remainingCount = await Teacher.countDocuments();
    console.log(`📊 Remaining teachers in database: ${remainingCount}`);
    
    if (remainingCount === 0) {
      console.log('🎉 All teachers have been successfully deleted!');
    } else {
      console.log('⚠️ Some teachers may still exist. Please check manually.');
    }
    
  } catch (error) {
    console.error('❌ Error deleting teachers:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the script
deleteAllTeachers(); 