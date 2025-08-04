const mongoose = require('mongoose');
const Teacher = require('./models/Teacher');
const config = require('./config/app-config');

// Check teacher images and identify real vs fake URLs
async function checkTeacherImages() {
  try {
    console.log('🔍 Checking teacher images...');
    
    // Connect to database
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Get all teachers
    const teachers = await Teacher.find({});
    console.log(`📊 Found ${teachers.length} teachers`);
    
    let realImages = 0;
    let fakeImages = 0;
    let defaultImages = 0;
    
    teachers.forEach((teacher, index) => {
      const imageUrl = teacher.imageUrl;
      
      if (imageUrl && imageUrl.startsWith('https://res.cloudinary.com/')) {
        // Check if it's a real Cloudinary URL (not our test URLs)
        if (imageUrl.includes('test-update') || imageUrl.includes('api-auth-test')) {
          console.log(`${index + 1}. ${teacher.name} - ❌ FAKE Cloudinary URL: ${imageUrl}`);
          fakeImages++;
        } else {
          console.log(`${index + 1}. ${teacher.name} - ✅ REAL Cloudinary URL: ${imageUrl}`);
          realImages++;
        }
      } else if (imageUrl && imageUrl.startsWith('data:image/svg+xml')) {
        console.log(`${index + 1}. ${teacher.name} - 🔄 DEFAULT SVG IMAGE`);
        defaultImages++;
      } else {
        console.log(`${index + 1}. ${teacher.name} - ❓ UNKNOWN IMAGE TYPE: ${imageUrl}`);
      }
    });
    
    console.log('\n📊 Summary:');
    console.log(`✅ Real Cloudinary images: ${realImages}`);
    console.log(`❌ Fake test images: ${fakeImages}`);
    console.log(`🔄 Default SVG images: ${defaultImages}`);
    console.log(`📝 Total teachers: ${teachers.length}`);
    
    // Show teachers with real images
    if (realImages > 0) {
      console.log('\n✅ Teachers with real Cloudinary images:');
      teachers.forEach((teacher, index) => {
        const imageUrl = teacher.imageUrl;
        if (imageUrl && imageUrl.startsWith('https://res.cloudinary.com/') && 
            !imageUrl.includes('test-update') && !imageUrl.includes('api-auth-test')) {
          console.log(`- ${teacher.name}: ${imageUrl}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the check
checkTeacherImages(); 