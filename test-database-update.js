const mongoose = require('mongoose');
const Teacher = require('./models/Teacher');
require('dotenv').config();

// Test database update functionality
async function testDatabaseUpdate() {
  try {
    console.log('🧪 Testing database update functionality...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Get a teacher to test with
    const teachers = await Teacher.find().limit(1);
    if (teachers.length === 0) {
      console.log('❌ No teachers found in database');
      return;
    }
    
    const testTeacher = teachers[0];
    console.log('🎯 Testing with teacher:', testTeacher.name, 'ID:', testTeacher._id);
    console.log('Current imageUrl:', testTeacher.imageUrl);
    
    // Test update with new image URL
    const newImageUrl = 'https://res.cloudinary.com/dwtru703l/image/upload/v1703123456/hims-college/test-update.jpg';
    
    const updateData = {
      name: testTeacher.name,
      position: testTeacher.position,
      expertise: testTeacher.expertise,
      description: testTeacher.description,
      rating: testTeacher.rating,
      order: testTeacher.order,
      isActive: testTeacher.isActive,
      imageUrl: newImageUrl
    };
    
    console.log('📤 Updating teacher with data:', updateData);
    
    // Perform the update
    const updatedTeacher = await Teacher.findByIdAndUpdate(
      testTeacher._id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedTeacher) {
      console.log('❌ Teacher not found for update');
      return;
    }
    
    console.log('✅ Teacher updated:', updatedTeacher.name);
    console.log('✅ New imageUrl:', updatedTeacher.imageUrl);
    
    // Save to ensure persistence
    await updatedTeacher.save();
    console.log('✅ Teacher saved to database');
    
    // Verify the update by fetching again
    const verifiedTeacher = await Teacher.findById(testTeacher._id);
    console.log('✅ Verification - Teacher fetched from database:');
    console.log('   Name:', verifiedTeacher.name);
    console.log('   ImageUrl:', verifiedTeacher.imageUrl);
    
    if (verifiedTeacher.imageUrl === newImageUrl) {
      console.log('✅ SUCCESS: Database update is working correctly!');
    } else {
      console.log('❌ FAILED: Database update is not working correctly');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the test
testDatabaseUpdate(); 