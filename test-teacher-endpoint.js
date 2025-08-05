const axios = require('axios');

// Test the teacher update endpoint
async function testTeacherEndpoint() {
  try {
    console.log('🧪 Testing teacher update endpoint...');
    
    const baseURL = 'http://localhost:5000';
    
    // Test 1: Check if the server is running
    console.log('📡 Testing server connection...');
    const statusResponse = await axios.get(`${baseURL}/api/status`);
    console.log('✅ Server status:', statusResponse.data);
    
    // Test 2: Check if content routes are available
    console.log('📡 Testing content routes...');
    const contentResponse = await axios.get(`${baseURL}/api/content/teachers`);
    console.log('✅ Content routes working:', contentResponse.data);
    
    // Test 3: Test the specific teacher update endpoint (will fail without auth, but tests route existence)
    console.log('📡 Testing teacher update endpoint...');
    const testTeacherId = '507f1f77bcf86cd799439011'; // Dummy ID
    const updateData = {
      name: 'Test Teacher',
      position: 'Test Position',
      expertise: 'Test Expertise',
      imageUrl: 'https://example.com/test.jpg'
    };
    
    try {
      const updateResponse = await axios.put(
        `${baseURL}/api/content/admin/teachers-url/${testTeacherId}`,
        updateData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          }
        }
      );
      console.log('✅ Update endpoint working:', updateResponse.data);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Endpoint exists but requires authentication (expected)');
      } else if (error.response && error.response.status === 404) {
        console.log('❌ Endpoint not found - route may not be registered');
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testTeacherEndpoint(); 