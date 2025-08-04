const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');
const { MONGODB_URI, DB_OPTIONS } = require('../config/app-config');

// Function to generate default profile image URL
const getDefaultProfileImageUrl = (name = 'Unknown', type = 'teacher') => {
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

async function updateTeacherImages() {
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    
    // Connect to MongoDB using the same configuration as the main server
    await mongoose.connect(MONGODB_URI, DB_OPTIONS);
    console.log('✅ Connected to MongoDB successfully!');

    // Find all teachers
    const teachers = await Teacher.find({});
    console.log(`📊 Found ${teachers.length} teachers to update`);

    // Update each teacher's imageUrl with generated default profile image
    const updatePromises = teachers.map(teacher => {
      const defaultImageUrl = getDefaultProfileImageUrl(teacher.name, 'teacher');
      return Teacher.findByIdAndUpdate(
        teacher._id,
        { imageUrl: defaultImageUrl },
        { new: true }
      );
    });

    await Promise.all(updatePromises);
    console.log(`✅ Updated ${teachers.length} teacher records`);
    console.log('🎨 All teachers now have simple gray square profile images stored in the database');

    // Display updated teachers
    const updatedTeachers = await Teacher.find({}).select('name position imageUrl');
    console.log('\n📋 Updated Teachers:');
    updatedTeachers.forEach((teacher, index) => {
      console.log(`${index + 1}. ${teacher.name} (${teacher.position}) - imageUrl: "${teacher.imageUrl.substring(0, 50)}..."`);
    });

  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

console.log('\n🎉 Teacher image update completed!');
console.log('💡 Teachers now have simple gray square profile images stored in database');

updateTeacherImages();