const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');
const config = require('../config/app-config');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dwtru703l',
  api_key: '964741116272599',
  api_secret: 'QckGC-axVOaemElOzmt50-rDepA'
});

// Helper function to upload to Cloudinary (simplified version)
const uploadToCloudinary = async (fileBuffer, originalname, folder) => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          public_id: `${Date.now()}-${Math.round(Math.random() * 1E9)}`,
          transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('✅ Image uploaded to Cloudinary successfully');
            resolve(result.secure_url);
          }
        }
      );
      
      uploadStream.on('error', (error) => {
        console.error('❌ Upload stream error:', error);
        reject(error);
      });
      
      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    console.error('❌ Image processing error:', error);
    throw new Error(`Failed to process image: ${error.message}`);
  }
};

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI, config.DB_OPTIONS);
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Generate default teacher profile image SVG
const generateDefaultTeacherImage = (name) => {
  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const svgContent = `
    <svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1E40AF;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.15"/>
        </filter>
      </defs>
      
      <!-- Background Square -->
      <rect x="0" y="0" width="400" height="400" fill="url(#grad)" filter="url(#shadow)" rx="20"/>
      
      <!-- Person Icon -->
      <g transform="translate(200, 200)">
        <!-- Head -->
        <circle cx="0" cy="-40" r="50" fill="white" opacity="0.9"/>
        <!-- Body -->
        <path d="M-70 40 Q-70 -10 0 -10 Q70 -10 70 40 L70 100 L-70 100 Z" fill="white" opacity="0.9"/>
      </g>
      
      <!-- Initials -->
      <text x="200" y="220" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="72" font-weight="bold" opacity="0.95">
        ${initials}
      </text>
      
      <!-- Teacher Badge -->
      <rect x="280" y="40" width="80" height="80" fill="#60A5FA" opacity="0.9" rx="10"/>
      <text x="320" y="92" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">
        T
      </text>
    </svg>
  `;

  return Buffer.from(svgContent);
};

// Update teacher images
const updateTeacherImages = async () => {
  try {
    console.log('🔄 Starting teacher image update...');
    
    // Get all teachers
    const teachers = await Teacher.find({});
    console.log(`📊 Found ${teachers.length} teachers to update`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const teacher of teachers) {
      try {
        // Check if teacher already has a proper image
        if (teacher.imageUrl && 
            (teacher.imageUrl.includes('cloudinary.com') || 
             teacher.imageUrl.includes('unsplash.com') ||
             teacher.imageUrl.includes('http'))) {
          console.log(`⏭️ Skipping ${teacher.name} - already has proper image`);
          skippedCount++;
          continue;
        }
        
        console.log(`🔄 Updating image for: ${teacher.name}`);
        
        // Generate default image
        const imageBuffer = generateDefaultTeacherImage(teacher.name);
        
        // Upload to Cloudinary
        const imageUrl = await uploadToCloudinary(
          imageBuffer, 
          `teacher-${teacher.name.toLowerCase().replace(/\s+/g, '-')}-default.png`,
          'hims-college/teachers'
        );
        
        // Update teacher in database
        await Teacher.findByIdAndUpdate(teacher._id, {
          imageUrl: imageUrl
        });
        
        console.log(`✅ Updated ${teacher.name} with new image: ${imageUrl}`);
        updatedCount++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Failed to update ${teacher.name}:`, error.message);
      }
    }
    
    console.log('\n📊 Update Summary:');
    console.log(`✅ Updated: ${updatedCount} teachers`);
    console.log(`⏭️ Skipped: ${skippedCount} teachers`);
    console.log(`📝 Total processed: ${teachers.length} teachers`);
    
  } catch (error) {
    console.error('❌ Error updating teacher images:', error);
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await updateTeacherImages();
    console.log('🎉 Teacher image update completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { updateTeacherImages }; 