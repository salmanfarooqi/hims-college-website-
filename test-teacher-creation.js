const http = require('http');

const testTeacherCreation = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '1234567890',
      department: 'Computer Science',
      status: 'active'
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/teachers/admin',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': 'Bearer test-token' // This will fail auth, but we can see the error
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
};

const runTest = async () => {
  console.log('Testing teacher creation endpoint...\n');

  try {
    const result = await testTeacherCreation();
    console.log('Teacher Creation Test Result:');
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
    
    if (result.status === 401) {
      console.log('\n✅ Expected: Authentication required');
    } else if (result.status === 503) {
      console.log('\n✅ Expected: Database not available with proper error message');
    } else {
      console.log('\n❌ Unexpected status code');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
};

runTest(); 