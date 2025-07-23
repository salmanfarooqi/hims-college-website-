const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });
const { connectDB } = require('./config/database');
const Admin = require('./models/Admin');

const testAdminCreation = async () => {
  try {
    console.log('Testing database connection...');
    await connectDB();
    console.log('Database connected successfully');

    // Check if admin already exists
    console.log('Checking for existing admin...');
    const existingAdmin = await Admin.findOne({ email: 'hims@gmail.com' });
    
    if (existingAdmin) {
      console.log('Admin already exists:');
      console.log('Email:', existingAdmin.email);
      console.log('Name:', existingAdmin.name);
      console.log('Role:', existingAdmin.role);
      console.log('Created at:', existingAdmin.createdAt);
      return;
    }

    console.log('Creating new admin...');
    const admin = new Admin({
      email: 'hims@gmail.com',
      password: 'hims123',
      name: 'HIMS College Administrator',
      role: 'super_admin'
    });

    await admin.save();
    console.log('Admin created successfully!');
    console.log('Email: hims@gmail.com');
    console.log('Password: hims123');
    console.log('Name: HIMS College Administrator');
    console.log('Role: super_admin');

  } catch (error) {
    console.error('Error:', error.message);
    if (error.code === 11000) {
      console.log('Admin with this email already exists');
    }
  } finally {
    process.exit(0);
  }
};

testAdminCreation(); 