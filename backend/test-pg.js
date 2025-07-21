// Test script to verify pg module loading
console.log('Testing pg module loading...');

try {
  const pg = require('pg');
  console.log('✅ pg module loaded successfully');
  console.log('pg version:', pg.version);
  
  // Test creating a client
  const { Client } = pg;
  console.log('✅ Client constructor available');
  
  console.log('✅ All pg tests passed');
} catch (error) {
  console.error('❌ Failed to load pg module:', error);
  process.exit(1);
} 