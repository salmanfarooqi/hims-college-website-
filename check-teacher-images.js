const mongoose = require('mongoose');
const Teacher = require('./models/Teacher');
const config = require('./config/app-config');

async function checkTeacherImages() {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to database');
    
    const teachers = await Teacher.find({});
    console.log(`📊 Found ${teachers.length} teachers`);
    
    teachers.forEach((teacher, index) => {
      console.log(`${index + 1}. ${teacher.name}`);
      console.log(`   Position: ${teacher.position}`);
      console.log(`   Image URL: ${teacher.imageUrl || 'NO IMAGE'}`);
      console.log(`   Active: ${teacher.isActive}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

checkTeacherImages(); 