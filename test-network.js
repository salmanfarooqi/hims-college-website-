const dns = require('dns').promises;
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function testNetwork() {
  console.log('Testing network connectivity to MongoDB Atlas...');
  
  try {
    // Test DNS resolution
    console.log('\n1. Testing DNS resolution...');
    const addresses = await dns.resolve4('cluster0.gitehdr.mongodb.net');
    console.log('✅ DNS resolution successful:', addresses);
    
    // Test ping (if available)
    console.log('\n2. Testing ping...');
    try {
      const { stdout } = await execAsync('ping -n 1 cluster0.gitehdr.mongodb.net');
      console.log('✅ Ping successful');
      console.log(stdout.split('\n')[1]); // Show first ping result
    } catch (pingError) {
      console.log('⚠️ Ping failed (this is normal on some systems)');
    }
    
    // Test port connectivity
    console.log('\n3. Testing port connectivity...');
    try {
      const { stdout } = await execAsync('telnet cluster0.gitehdr.mongodb.net 27017');
      console.log('✅ Port 27017 is reachable');
    } catch (telnetError) {
      console.log('⚠️ Telnet test failed (this is normal if telnet is not installed)');
    }
    
    console.log('\n✅ Network connectivity tests completed');
    
  } catch (error) {
    console.error('❌ Network test failed:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('\n💡 DNS resolution failed. This might be due to:');
      console.log('   - Network connectivity issues');
      console.log('   - Firewall blocking DNS queries');
      console.log('   - VPN or proxy interference');
    }
  }
}

testNetwork(); 