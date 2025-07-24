const http = require('http');

const testEndpoint = (path) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET'
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

    req.end();
  });
};

const runTests = async () => {
  console.log('Testing API endpoints...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const health = await testEndpoint('/api/health');
    console.log('Health:', health.status, health.data);
    console.log('');

    // Test teachers endpoint
    console.log('2. Testing teachers endpoint...');
    const teachers = await testEndpoint('/api/teachers');
    console.log('Teachers:', teachers.status, teachers.data);
    console.log('');

    // Test applications statistics
    console.log('3. Testing applications statistics...');
    const stats = await testEndpoint('/api/applications/statistics');
    console.log('Statistics:', stats.status, stats.data);
    console.log('');

    // Test admin applications (should work with fallback)
    console.log('4. Testing admin applications...');
    const adminApps = await testEndpoint('/admin/api/applications');
    console.log('Admin Apps:', adminApps.status, adminApps.data);
    console.log('');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
};

runTests(); 