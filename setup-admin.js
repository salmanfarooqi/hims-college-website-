const { connectDB } = require('./config/database');
const Admin = require('./models/Admin');
require('dotenv').config({ path: './config.env' });

const setupAdmin = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('MongoDB connected successfully');

    // Check if admin already exists
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      console.log('Admin account already exists');
      process.exit(0);
    }

    // Create admin account
    const admin = await Admin.create({
      email: process.env.ADMIN_EMAIL || 'hims@gmail.com',
      password: process.env.ADMIN_PASSWORD || 'hims123',
      name: 'HIMS College Administrator',
      role: 'super_admin'
    });

    console.log('Admin account created successfully');
    console.log('Email:', admin.email);
    console.log('Password:', process.env.ADMIN_PASSWORD || 'hims123');
    process.exit(0);
  } catch (error) {
    console.error('Failed to setup admin:', error);
    process.exit(1);
  }
};

setupAdmin(); 