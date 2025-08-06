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

// Helper function to upload to Cloudinary
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

// Generate a simple test image
const generateTestImage = () => {
  const svgContent = `
    <svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="400" height="400" fill="#f0f0f0"/>
      <circle cx="200" cy="200" r="100" fill="#007bff"/>
      <text x="200" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="white">TEST</text>
    </svg>
  `;
  return Buffer.from(svgContent);
};

async function testImageUpload() {
  try {
    console.log('🔄 Testing image upload functionality...');
    
    // Generate a test image
    const testImageBuffer = generateTestImage();
    console.log('📸 Generated test image buffer');
    
    // Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(
      testImageBuffer,
      'test-image.svg',
      'hims-college/test'
    );
    
    console.log('✅ Test image uploaded successfully!');
    console.log('📸 Image URL:', imageUrl);
    
    // Test creating a teacher with this image
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to database');
    
    const testTeacher = new Teacher({
      name: 'Test Teacher',
      position: 'Test Position',
      expertise: 'Test Expertise',
      description: 'Test Description',
      rating: 5,
      order: 0,
      isActive: true,
      imageUrl: imageUrl
    });
    
    await testTeacher.save();
    console.log('✅ Test teacher created with image URL');
    console.log('📊 Teacher data:', {
      name: testTeacher.name,
      imageUrl: testTeacher.imageUrl
    });
    
    // Clean up - delete the test teacher
    await Teacher.findByIdAndDelete(testTeacher._id);
    console.log('🧹 Test teacher cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

testImageUpload(); 