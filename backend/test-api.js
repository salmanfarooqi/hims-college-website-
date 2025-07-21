// Test script to verify API endpoints
const axios = require('axios');

// Replace with your actual Vercel URL
const BASE_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

console.log('Testing API endpoints...');
console.log('Base URL:', BASE_URL);

async function testEndpoint(path, method = 'GET', data = null) {
  try {
    const url = `${BASE_URL}${path}`;
    console.log(`\n🔍 Testing ${method} ${url}`);
    
    const response = await axios({
      method,
      url,
      data,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ ${method} ${path} - Status: ${response.status}`);
    if (response.data) {
      console.log('Response:', JSON.stringify(response.data, null, 2));
    }
    return true;
  } catch (error) {
    console.log(`❌ ${method} ${path} - Error: ${error.response?.status || error.message}`);
    if (error.response?.data) {
      console.log('Error details:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

async function runTests() {
  console.log('\n🚀 Starting API Tests...\n');
  
  // Test health endpoints
  await testEndpoint('/');
  await testEndpoint('/api');
  
  // Test public endpoints
  await testEndpoint('/api/content/hero-slides');
  
  // Test application submission (POST)
  const testApplication = {
    firstName: 'Test',
    lastName: 'User',
    email: `test${Date.now()}@example.com`,
    phone: '1234567890',
    dateOfBirth: '1990-01-01',
    gender: 'Other',
    address: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    program: 'Computer Science',
    previousSchool: 'Test School',
    previousGrade: 'A'
  };
  
  await testEndpoint('/api/applications', 'POST', testApplication);
  
  // Test admin login (this will fail without valid credentials, but should return 401, not 404)
  await testEndpoint('/api/admin/login', 'POST', {
    email: 'test@example.com',
    password: 'wrongpassword'
  });
  
  console.log('\n🎉 API Tests Completed!');
  console.log('\n📋 Available Endpoints:');
  console.log('GET  /                    - Health check');
  console.log('GET  /api                 - API health check');
  console.log('POST /api/applications    - Submit application');
  console.log('GET  /api/content/hero-slides - Get hero slides');
  console.log('POST /api/admin/login     - Admin login');
  console.log('GET  /api/admin/applications - Get applications (requires auth)');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testEndpoint, runTests }; 