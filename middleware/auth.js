const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    
    // Handle temporary admin
    if (decoded.id === 'temp-admin-id') {
      req.admin = {
        _id: 'temp-admin-id',
        email: 'hims@gmail.com',
        name: 'HIMS College Administrator',
        role: 'super_admin'
      };
      return next();
    }

    // Try database lookup for real admin
    try {
      const admin = await Admin.findById(decoded.id);
      if (!admin) {
        return res.status(401).json({ error: 'Invalid token.' });
      }
      req.admin = admin;
      next();
    } catch (dbError) {
      console.log('Database lookup failed in auth middleware');
      return res.status(401).json({ error: 'Invalid token.' });
    }
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

module.exports = auth; 