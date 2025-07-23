const axios = require('axios');

const addAdmin = async () => {
  try {
    console.log('Adding admin via API...');
    
    const response = await axios.post('http://localhost:5000/api/admin/setup', {});
    
    console.log('Response:', response.data);
    console.log('Admin created successfully!');
    console.log('Email: hims@gmail.com');
    console.log('Password: hims123');
    
  } catch (error) {
    if (error.response) {
      console.error('Error response:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
};

addAdmin(); 