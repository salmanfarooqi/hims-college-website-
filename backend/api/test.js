const express = require('express');
const serverless = require('serverless-http');

const app = express();

app.use(express.json());

// Simple test endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Test API is working',
    timestamp: new Date().toISOString()
  });
});

app.get('/api', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Test API is working',
    timestamp: new Date().toISOString()
  });
});

module.exports = serverless(app); 