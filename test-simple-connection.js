const connectDB = require('./config/database');

console.log('Testing simple database connection...');

connectDB()
  .then(() => {
    console.log('✅ Connection successful!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }); 