const { connectDB } = require('./config/database');
const Admin = require('./models/Admin');
require('dotenv').config({ path: './config.env' });

const setupAdmin = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('MongoDB connected successfully');

    // Check if admin already exists with the specific email
    const existingAdmin = await Admin.findOne({ email: 'hims@gmail.com' });
    if (existingAdmin) {
      console.log('Admin account already exists with email: hims@gmail.com');
      console.log('You can use these credentials to login:');
      console.log('Email: hims@gmail.com');
      console.log('Password: hims123');
      process.exit(0);
    }

    // Create admin account with specific credentials
    const admin = await Admin.create({
      email: 'hims@gmail.com',
      password: 'hims123',
      name: 'HIMS College Administrator',
      role: 'super_admin'
    });

    console.log('Admin account created successfully!');
    console.log('Email: hims@gmail.com');
    console.log('Password: hims123');
    console.log('You can now login to the admin panel with these credentials.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to setup admin:', error);
    process.exit(1);
  }
};

setupAdmin(); 