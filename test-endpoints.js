const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testEndpoints() {
  console.log('Testing API endpoints...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Health endpoint working:', healthResponse.data);

    // Test content/teachers endpoint
    console.log('\n2. Testing /api/content/teachers endpoint...');
    try {
      const teachersResponse = await axios.get(`${BASE_URL}/api/content/teachers`);
      console.log('✅ Teachers endpoint working:', teachersResponse.data);
    } catch (error) {
      console.log('❌ Teachers endpoint failed:', error.response?.data || error.message);
    }

    // Test content/students endpoint
    console.log('\n3. Testing /api/content/students endpoint...');
    try {
      const studentsResponse = await axios.get(`${BASE_URL}/api/content/students`);
      console.log('✅ Students endpoint working:', studentsResponse.data);
    } catch (error) {
      console.log('❌ Students endpoint failed:', error.response?.data || error.message);
    }

    // Test hero-slides endpoint for comparison
    console.log('\n4. Testing /api/content/hero-slides endpoint...');
    try {
      const slidesResponse = await axios.get(`${BASE_URL}/api/content/hero-slides`);
      console.log('✅ Hero slides endpoint working:', slidesResponse.data);
    } catch (error) {
      console.log('❌ Hero slides endpoint failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEndpoints(); 