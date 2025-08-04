const axios = require('axios');

// Test the teacher update API endpoint
async function testTeacherUpdateAPI() {
  try {
    console.log('🔄 Testing teacher update API endpoint...');
    
    const baseURL = 'http://localhost:5000';
    
    // First, let's get all teachers
    console.log('📥 Fetching all teachers...');
    const teachersResponse = await axios.get(`${baseURL}/api/content/teachers`);
    console.log(`✅ Found ${teachersResponse.data.length} teachers`);
    
    if (teachersResponse.data.length === 0) {
      console.log('❌ No teachers found');
      return;
    }
    
    // Get the first teacher
    const teacher = teachersResponse.data[0];
    console.log(`📝 Testing with teacher: ${teacher.name}`);
    console.log(`📸 Current image URL: ${teacher.imageUrl ? 'Has image' : 'No image'}`);
    
    // Test updating teacher image via API
    const newImageUrl = 'https://res.cloudinary.com/dwtru703l/image/upload/v1754331231/hims-college/teachers/api-test.png';
    
    console.log('🔄 Updating teacher image via API...');
    const updateResponse = await axios.put(
      `${baseURL}/api/content/admin/teachers/${teacher._id}`,
      {
        imageUrl: newImageUrl,
        name: teacher.name,
        position: teacher.position,
        expertise: teacher.expertise,
        description: teacher.description,
        rating: teacher.rating,
        order: teacher.order,
        isActive: teacher.isActive
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token' // This will work with the temp admin
        }
      }
    );
    
    if (updateResponse.status === 200) {
      console.log('✅ Teacher update API call successful!');
      console.log(`📸 Updated teacher: ${updateResponse.data.teacher.name}`);
      console.log(`📸 New image URL: ${updateResponse.data.teacher.imageUrl}`);
    } else {
      console.log('❌ Teacher update API call failed');
    }
    
    // Verify the update by fetching the teacher again
    console.log('🔄 Verifying update by fetching teacher again...');
    const verifyResponse = await axios.get(`${baseURL}/api/content/teachers`);
    const updatedTeacher = verifyResponse.data.find(t => t._id === teacher._id);
    
    if (updatedTeacher && updatedTeacher.imageUrl === newImageUrl) {
      console.log('✅ Update verification successful!');
      console.log(`📸 Verified image URL: ${updatedTeacher.imageUrl}`);
    } else {
      console.log('❌ Update verification failed');
      console.log(`📸 Expected: ${newImageUrl}`);
      console.log(`📸 Actual: ${updatedTeacher?.imageUrl}`);
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testTeacherUpdateAPI(); 