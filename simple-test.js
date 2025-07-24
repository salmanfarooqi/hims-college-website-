const http = require('http');

const testEndpoint = (method, path, data = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('Testing teacher creation...\n');

  try {
    // Test teacher creation without auth
    console.log('1. Testing teacher creation without authentication...');
    const result1 = await testEndpoint('POST', '/api/teachers/admin', {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      department: 'CS',
      status: 'active'
    });
    console.log('Result:', result1.status, result1.data);
    console.log('');

    // Test teacher creation with invalid auth
    console.log('2. Testing teacher creation with invalid token...');
    const result2 = await testEndpoint('POST', '/api/teachers/admin', {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      department: 'Math',
      status: 'active'
    }, {
      'Authorization': 'Bearer invalid-token'
    });
    console.log('Result:', result2.status, result2.data);
    console.log('');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
};

runTests(); 