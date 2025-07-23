const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });
const { connectDB } = require('./config/database');
const Admin = require('./models/Admin');

const createAdmin = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'hims@123gmail.com' });
    if (existingAdmin) {
      console.log('Admin already exists with email: hims@123gmail.com');
      console.log('Email: hims@123gmail.com');
      console.log('Password: hims123');
      process.exit(0);
    }

    // Create new admin
    const admin = new Admin({
      email: 'hims@123gmail.com',
      password: 'hims123',
      name: 'HIMS Administrator',
      role: 'super_admin'
    });

    await admin.save();
    console.log('Admin created successfully!');
    console.log('Email: hims@123gmail.com');
    console.log('Password: hims123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin(); 