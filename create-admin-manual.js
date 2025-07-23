const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const createAdminAccount = async () => {
  try {
    console.log('Creating admin account...');
    
    // Use the existing admin setup endpoint
    const response = await axios.post(`${BASE_URL}/admin/setup`);
    
    console.log('✅ Admin account created successfully!');
    console.log('Email: hims@gmail.com');
    console.log('Password: hims123');
    console.log('You can now login to the admin panel.');
    
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.error === 'Admin already exists') {
      console.log('✅ Admin account already exists!');
      console.log('Email: hims@gmail.com');
      console.log('Password: hims123');
    } else {
      console.error('❌ Failed to create admin account:', error.response?.data?.error || error.message);
    }
  }
};

createAdminAccount(); 