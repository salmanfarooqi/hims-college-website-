const mongoose = require('mongoose');
const Teacher = require('./models/Teacher');
const config = require('./config/app-config');
const cloudinary = require('cloudinary').v2;
const sharp = require('sharp');

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dwtru703l',
  api_key: '964741116272599',
  api_secret: 'QckGC-axVOaemElOzmt50-rDepA'
});

// Helper function to upload to Cloudinary (copied from routes/content.js)
const uploadToCloudinary = async (fileBuffer, originalname, folder) => {
  try {
    console.log('🖼️ Processing image for upload...');
    console.log('📏 Original size:', Math.round(fileBuffer.length / 1024 / 1024 * 100) / 100, 'MB');
    console.log('📄 File type:', originalname.split('.').pop().toLowerCase());
    
    let compressedBuffer = fileBuffer;
    let quality = 80;
    let maxWidth = 1920;
    let maxHeight = 1080;
    
    // More aggressive compression for large files
    if (fileBuffer.length > 50 * 1024 * 1024) {
      quality = 50;
      maxWidth = 1200;
      maxHeight = 800;
    } else if (fileBuffer.length > 20 * 1024 * 1024) {
      quality = 60;
      maxWidth = 1600;
      maxHeight = 900;
    } else if (fileBuffer.length > 10 * 1024 * 1024) {
      quality = 70;
      maxWidth = 1800;
      maxHeight = 1000;
    }
    
    // Try to process the image with Sharp
    try {
      console.log('🔧 Attempting image compression with Sharp...');
      
      const metadata = await sharp(fileBuffer).metadata();
      console.log('📊 Image metadata:', {
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        channels: metadata.channels
      });
      
      compressedBuffer = await sharp(fileBuffer, {
        failOnError: false,
        limitInputPixels: false
      })
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ 
          quality: quality,
          progressive: true,
          mozjpeg: true
        })
        .toBuffer();
      
      console.log('📏 Compressed size:', Math.round(compressedBuffer.length / 1024 / 1024 * 100) / 100, 'MB');
      console.log('📊 Compression ratio:', Math.round((1 - compressedBuffer.length / fileBuffer.length) * 100) + '%');
      
    } catch (sharpError) {
      console.error('❌ Sharp processing failed:', sharpError.message);
      console.log('🔄 Using original file buffer without processing');
      compressedBuffer = fileBuffer;
    }
    
    // Upload to Cloudinary
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          public_id: `${Date.now()}-${Math.round(Math.random() * 1E9)}`,
          transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ],
          chunk_size: 6000000,
          eager: [
            { width: 800, height: 600, crop: 'fill', quality: 'auto' },
            { width: 400, height: 300, crop: 'fill', quality: 'auto' }
          ],
          eager_async: true
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('✅ Image uploaded to Cloudinary successfully');
            console.log('📊 Upload result:', {
              url: result.secure_url,
              public_id: result.public_id,
              bytes: result.bytes,
              format: result.format,
              width: result.width,
              height: result.height
            });
            resolve(result.secure_url);
          }
        }
      );
      
      uploadStream.on('error', (error) => {
        console.error('❌ Upload stream error:', error);
        reject(error);
      });
      
      uploadStream.end(compressedBuffer);
    });
  } catch (error) {
    console.error('❌ Image processing error:', error);
    throw new Error(`Failed to process image: ${error.message}`);
  }
};

// Generate a proper black and white square profile image
const generateProfileImage = (name) => {
  const svgContent = `
    <svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <!-- White background -->
      <rect x="0" y="0" width="400" height="400" fill="#ffffff"/>
      
      <!-- Black border -->
      <rect x="0" y="0" width="400" height="400" fill="none" stroke="#000000" stroke-width="3"/>
      
      <!-- Black and white person icon in center -->
      <g transform="translate(200, 200)">
        <!-- Head -->
        <circle cx="0" cy="-40" r="45" fill="#000000"/>
        <circle cx="0" cy="-40" r="40" fill="#ffffff"/>
        <circle cx="0" cy="-40" r="35" fill="#000000"/>
        
        <!-- Body -->
        <path d="M-60 30 Q-60 -20 0 -20 Q60 -20 60 30 L60 90 L-60 90 Z" fill="#000000"/>
        <path d="M-55 35 Q-55 -15 0 -15 Q55 -15 55 35 L55 85 L-55 85 Z" fill="#ffffff"/>
        <path d="M-50 40 Q-50 -10 0 -10 Q50 -10 50 40 L50 80 L-50 80 Z" fill="#000000"/>
      </g>
      
      <!-- Teacher name at bottom -->
      <text x="200" y="350" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#000000">${name}</text>
    </svg>
  `;
  return Buffer.from(svgContent);
};

// Upload profile images for all teachers
async function uploadTeacherProfileImages() {
  try {
    console.log('🔄 Starting teacher profile image upload...');
    
    // Connect to database
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Get all teachers
    const teachers = await Teacher.find({});
    console.log(`📊 Found ${teachers.length} teachers`);
    
    let uploadedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    
    for (const teacher of teachers) {
      try {
        console.log(`🔄 Processing: ${teacher.name}`);
        
        // Generate profile image
        const imageBuffer = generateProfileImage(teacher.name);
        
        // Upload to Cloudinary
        const imageUrl = await uploadToCloudinary(
          imageBuffer, 
          `teacher-${teacher.name.toLowerCase().replace(/\s+/g, '-')}-profile.png`,
          'hims-college/teachers'
        );
        
        // Update teacher in database
        await Teacher.findByIdAndUpdate(teacher._id, {
          imageUrl: imageUrl
        });
        
        console.log(`✅ Uploaded profile image for: ${teacher.name}`);
        console.log(`📸 Image URL: ${imageUrl}`);
        uploadedCount++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Failed to upload for ${teacher.name}:`, error.message);
        failedCount++;
      }
    }
    
    console.log('\n📊 Upload Summary:');
    console.log(`✅ Successfully uploaded: ${uploadedCount} teachers`);
    console.log(`❌ Failed uploads: ${failedCount} teachers`);
    console.log(`⏭️ Skipped: ${skippedCount} teachers`);
    console.log(`📝 Total processed: ${teachers.length} teachers`);
    
    // Verify the uploads
    console.log('\n🔍 Verifying uploads...');
    const updatedTeachers = await Teacher.find({});
    let cloudinaryCount = 0;
    let defaultCount = 0;
    
    updatedTeachers.forEach(teacher => {
      if (teacher.imageUrl && teacher.imageUrl.includes('cloudinary.com')) {
        cloudinaryCount++;
      } else {
        defaultCount++;
      }
    });
    
    console.log(`✅ Cloudinary images: ${cloudinaryCount}`);
    console.log(`🔄 Default images: ${defaultCount}`);
    
    // Show some example URLs
    if (cloudinaryCount > 0) {
      console.log('\n📸 Example Cloudinary URLs:');
      updatedTeachers.slice(0, 3).forEach(teacher => {
        if (teacher.imageUrl && teacher.imageUrl.includes('cloudinary.com')) {
          console.log(`- ${teacher.name}: ${teacher.imageUrl}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Upload process failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the upload process
uploadTeacherProfileImages(); 