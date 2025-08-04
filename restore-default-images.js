const mongoose = require('mongoose');
const Teacher = require('./models/Teacher');
const config = require('./config/app-config');

// Generate default SVG image for a teacher
const generateDefaultTeacherImage = (name) => {
  const svgContent = `
    <svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <!-- Light gray background square -->
      <rect x="0" y="0" width="400" height="400" fill="#f3f4f6"/>
      
      <!-- Dark gray border -->
      <rect x="0" y="0" width="400" height="400" fill="none" stroke="#d1d5db" stroke-width="2"/>
      
      <!-- Simple person icon in center -->
      <g transform="translate(200, 200)">
        <!-- Head -->
        <circle cx="0" cy="-30" r="35" fill="#9ca3af"/>
        <!-- Body -->
        <path d="M-50 20 Q-50 -10 0 -10 Q50 -10 50 20 L50 70 L-50 70 Z" fill="#9ca3af"/>
      </g>
    </svg>
  `;
  return `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
};

// Restore default images for teachers
async function restoreDefaultImages() {
  try {
    console.log('🔄 Restoring default images for teachers...');
    
    // Connect to database
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Get all teachers
    const teachers = await Teacher.find({});
    console.log(`📊 Found ${teachers.length} teachers`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const teacher of teachers) {
      const imageUrl = teacher.imageUrl;
      
      // Check if teacher has a fake test URL or needs default image
      if (imageUrl && imageUrl.includes('test-update') || imageUrl.includes('api-auth-test')) {
        console.log(`🔄 Restoring default image for: ${teacher.name}`);
        
        const defaultImage = generateDefaultTeacherImage(teacher.name);
        
        await Teacher.findByIdAndUpdate(teacher._id, {
          imageUrl: defaultImage
        });
        
        console.log(`✅ Restored default image for: ${teacher.name}`);
        updatedCount++;
      } else if (!imageUrl || imageUrl.startsWith('data:image/svg+xml')) {
        // Already has default image or no image
        console.log(`⏭️ Skipping ${teacher.name} - already has default image`);
        skippedCount++;
      } else {
        // Has a real Cloudinary image, keep it
        console.log(`✅ Keeping real image for: ${teacher.name}`);
        skippedCount++;
      }
    }
    
    console.log('\n📊 Restore Summary:');
    console.log(`✅ Updated: ${updatedCount} teachers`);
    console.log(`⏭️ Skipped: ${skippedCount} teachers`);
    console.log(`📝 Total processed: ${teachers.length} teachers`);
    
    // Verify the changes
    console.log('\n🔍 Verifying changes...');
    const updatedTeachers = await Teacher.find({});
    let fakeCount = 0;
    let defaultCount = 0;
    
    updatedTeachers.forEach(teacher => {
      if (teacher.imageUrl && teacher.imageUrl.includes('test-update')) {
        fakeCount++;
      } else if (teacher.imageUrl && teacher.imageUrl.startsWith('data:image/svg+xml')) {
        defaultCount++;
      }
    });
    
    console.log(`✅ Fake URLs remaining: ${fakeCount}`);
    console.log(`✅ Default images: ${defaultCount}`);
    
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the restore
restoreDefaultImages(); 