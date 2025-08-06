const mongoose = require('mongoose');
const { connectDB } = require('./config/database');
const Teacher = require('./models/Teacher');

// Script to delete all teachers and ensure proper order system
const deleteAllTeachersAndFixOrder = async () => {
  try {
    console.log('🔄 Starting teacher cleanup and order fix...');
    
    // Connect to database
    await connectDB();
    
    // Step 1: Delete all existing teachers
    console.log('🗑️ Deleting all existing teachers...');
    const deleteResult = await Teacher.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} teachers`);
    
    // Step 2: Verify deletion
    const remainingTeachers = await Teacher.countDocuments();
    console.log(`📊 Remaining teachers: ${remainingTeachers}`);
    
    if (remainingTeachers === 0) {
      console.log('✅ All teachers successfully deleted!');
      console.log('\n📋 Order System Information:');
      console.log('- When you create new teachers, assign order values: 1, 2, 3, 4, 5, 6, 7, 8, 9...');
      console.log('- The system will sort teachers by order field in ascending order');
      console.log('- Lower order numbers appear first (order: 1 comes before order: 2)');
      console.log('- If no order is specified, it defaults to 0');
      
      console.log('\n🔧 To ensure proper ordering when creating teachers:');
      console.log('1. Always specify an "order" field when creating teachers');
      console.log('2. Use sequential numbers: 1, 2, 3, 4, 5...');
      console.log('3. The frontend will display teachers sorted by this order');
      
      console.log('\n📝 Example teacher creation with proper order:');
      console.log(`
{
  "name": "John Doe",
  "position": "Professor",
  "expertise": "Mathematics",
  "order": 1,
  "isActive": true
}
      `);
    } else {
      console.log('⚠️ Some teachers may still exist. Please check manually.');
    }
    
  } catch (error) {
    console.error('❌ Error during teacher cleanup:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Also create a function to reorder existing teachers (if needed in future)
const reorderExistingTeachers = async () => {
  try {
    console.log('🔄 Reordering existing teachers...');
    
    await connectDB();
    
    // Get all teachers sorted by current order, then by name
    const teachers = await Teacher.find().sort({ order: 1, name: 1 });
    
    console.log(`📊 Found ${teachers.length} teachers to reorder`);
    
    // Update each teacher with sequential order
    for (let i = 0; i < teachers.length; i++) {
      const newOrder = i + 1; // Start from 1
      await Teacher.findByIdAndUpdate(teachers[i]._id, { order: newOrder });
      console.log(`✅ Updated ${teachers[i].name} - Order: ${newOrder}`);
    }
    
    console.log('✅ All teachers reordered successfully!');
    
  } catch (error) {
    console.error('❌ Error during reordering:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the script
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--reorder-only')) {
    console.log('🔄 Running reorder-only mode...');
    reorderExistingTeachers();
  } else {
    console.log('🗑️ Running delete-all mode...');
    deleteAllTeachersAndFixOrder();
  }
}

module.exports = { deleteAllTeachersAndFixOrder, reorderExistingTeachers };