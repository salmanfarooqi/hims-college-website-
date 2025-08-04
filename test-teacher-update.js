const mongoose = require('mongoose');
const Teacher = require('./models/Teacher');
const config = require('./config/app-config');

// Test teacher update functionality
async function testTeacherUpdate() {
  try {
    console.log('🔄 Testing teacher update functionality...');
    
    // Connect to database
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Get a teacher to test with
    const teacher = await Teacher.findOne({});
    if (!teacher) {
      console.log('❌ No teachers found in database');
      return;
    }
    
    console.log(`📝 Testing with teacher: ${teacher.name}`);
    console.log(`📸 Current image URL: ${teacher.imageUrl}`);
    
    // Test updating teacher image
    const newImageUrl = 'https://res.cloudinary.com/dwtru703l/image/upload/v1754331231/hims-college/teachers/test-update.png';
    
    const updatedTeacher = await Teacher.findByIdAndUpdate(
      teacher._id,
      { imageUrl: newImageUrl },
      { new: true }
    );
    
    if (updatedTeacher && updatedTeacher.imageUrl === newImageUrl) {
      console.log('✅ Teacher image update successful!');
      console.log(`📸 New image URL: ${updatedTeacher.imageUrl}`);
    } else {
      console.log('❌ Teacher image update failed');
    }
    
    // Test getting all teachers
    const allTeachers = await Teacher.find({});
    console.log(`📊 Total teachers in database: ${allTeachers.length}`);
    
    // Show teachers with their image URLs
    allTeachers.forEach((t, index) => {
      console.log(`${index + 1}. ${t.name} - ${t.imageUrl ? 'Has image' : 'No image'}`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the test
testTeacherUpdate(); 