const mongoose = require('mongoose');
const Teacher = require('./models/Teacher');
const config = require('./config/app-config');

async function testTeacherCreation() {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Check existing teachers
    const existingTeachers = await Teacher.find({});
    console.log(`📊 Found ${existingTeachers.length} existing teachers`);
    
    // Create a test teacher
    const testTeacher = new Teacher({
      name: 'Test Teacher',
      position: 'Test Position',
      expertise: 'Test Expertise',
      description: 'Test Description',
      rating: 5,
      order: 0,
      isActive: true,
      imageUrl: '' // Empty image URL
    });
    
    await testTeacher.save();
    console.log('✅ Test teacher created successfully');
    console.log('📝 Teacher data:', {
      id: testTeacher._id,
      name: testTeacher.name,
      imageUrl: testTeacher.imageUrl || 'NO IMAGE'
    });
    
    // Check all teachers again
    const allTeachers = await Teacher.find({});
    console.log(`📊 Total teachers now: ${allTeachers.length}`);
    
    allTeachers.forEach((teacher, index) => {
      console.log(`${index + 1}. ${teacher.name} - Image: ${teacher.imageUrl || 'NO IMAGE'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

testTeacherCreation(); 