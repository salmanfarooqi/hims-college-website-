const axios = require('axios');

// Test the teacher update API endpoint with proper authentication
async function testTeacherUpdateAPIWithAuth() {
  try {
    console.log('🔄 Testing teacher update API endpoint with authentication...');
    
    const baseURL = 'http://localhost:5000';
    
    // First, login to get a token
    console.log('🔐 Logging in to get authentication token...');
    const loginResponse = await axios.post(`${baseURL}/api/admin/login`, {
      email: 'hims@gmail.com',
      password: 'hims123'
    });
    
    if (loginResponse.status !== 200) {
      console.log('❌ Login failed');
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, got token');
    
    // Get all teachers
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
    const newImageUrl = 'https://res.cloudinary.com/dwtru703l/image/upload/v1754331231/hims-college/teachers/api-auth-test.png';
    
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
          'Authorization': `Bearer ${token}`
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
    
    // Test getting teachers with cache busting
    console.log('🔄 Testing teachers endpoint with cache busting...');
    const teachersWithCache = await axios.get(`${baseURL}/api/content/teachers`);
    console.log(`✅ Retrieved ${teachersWithCache.data.length} teachers successfully`);
    
    // Show some teacher details
    teachersWithCache.data.slice(0, 3).forEach((t, index) => {
      console.log(`${index + 1}. ${t.name} - ${t.imageUrl ? 'Has Cloudinary image' : 'Default image'}`);
    });
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testTeacherUpdateAPIWithAuth(); 