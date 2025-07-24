const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Helper function to check if database is ready
const isDatabaseReady = () => {
  return mongoose.connection.readyState === 1;
};

// Get all active teachers (public)
router.get('/', async (req, res) => {
  try {
    console.log('Fetching teachers...');
    
    // Check if database is ready
    if (!isDatabaseReady()) {
      console.log('Database not ready, returning fallback data');
      return res.json({
        teachers: [],
        message: 'Database temporarily unavailable - showing fallback data',
        fallback: true
      });
    }
    
    const teachers = await Teacher.find({ status: 'active' })
      .select('-__v')
      .sort({ lastName: 1, firstName: 1 });
    
    console.log(`Returning ${teachers.length} active teachers`);
    res.json({
      teachers,
      fallback: false
    });
    
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch teachers',
      message: 'Database connection issue. Please try again later.',
      fallbackData: {
        teachers: [],
        fallback: true
      }
    });
  }
});

// Get teacher by ID (public)
router.get('/:id', async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      console.log('Database not ready, returning fallback teacher data');
      return res.json({
        message: 'Database temporarily unavailable - showing fallback data',
        fallback: true
      });
    }
    
    const teacher = await Teacher.findById(req.params.id).select('-__v');
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    res.json({
      ...teacher.toObject(),
      fallback: false
    });
  } catch (error) {
    console.error('Error fetching teacher:', error);
    res.status(500).json({ 
      error: 'Failed to fetch teacher',
      message: 'Database connection issue. Please try again later.',
      fallback: true
    });
  }
});

// Admin endpoints for teachers
router.get('/admin/all', auth, async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      console.log('Database not ready, returning fallback admin teachers data');
      return res.json({
        teachers: [],
        message: 'Database temporarily unavailable - showing fallback data',
        fallback: true
      });
    }
    
    const teachers = await Teacher.find()
      .select('-__v')
      .sort({ lastName: 1, firstName: 1 });
    
    res.json({
      teachers,
      fallback: false
    });
  } catch (error) {
    console.error('Error fetching admin teachers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch teachers',
      message: 'Database connection issue. Please try again later.',
      fallbackData: {
        teachers: [],
        fallback: true
      }
    });
  }
});

// Create new teacher (admin only)
router.post('/admin', auth, async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      console.log('Database not ready, cannot create teacher');
      return res.status(503).json({ 
        error: 'Database not available',
        message: 'Cannot create teacher while database is unavailable. Please try again later.',
        fallback: true
      });
    }
    
    const teacher = new Teacher(req.body);
    await teacher.save();
    
    res.status(201).json({ 
      message: 'Teacher created successfully', 
      teacher,
      fallback: false
    });
  } catch (error) {
    console.error('Error creating teacher:', error);
    res.status(500).json({ 
      error: 'Failed to create teacher',
      message: 'Database connection issue or validation error. Please check your data and try again.',
      details: error.message
    });
  }
});

// Update teacher (admin only)
router.put('/admin/:id', auth, async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      console.log('Database not ready, cannot update teacher');
      return res.status(503).json({ 
        error: 'Database not available',
        message: 'Cannot update teacher while database is unavailable. Please try again later.',
        fallback: true
      });
    }
    
    const teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    res.json({ 
      message: 'Teacher updated successfully', 
      teacher,
      fallback: false
    });
  } catch (error) {
    console.error('Error updating teacher:', error);
    res.status(500).json({ 
      error: 'Failed to update teacher',
      message: 'Database connection issue or validation error. Please check your data and try again.',
      details: error.message
    });
  }
});

// Delete teacher (admin only)
router.delete('/admin/:id', auth, async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      console.log('Database not ready, cannot delete teacher');
      return res.status(503).json({ 
        error: 'Database not available',
        message: 'Cannot delete teacher while database is unavailable. Please try again later.',
        fallback: true
      });
    }
    
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    res.json({ 
      message: 'Teacher deleted successfully',
      fallback: false
    });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    res.status(500).json({ 
      error: 'Failed to delete teacher',
      message: 'Database connection issue. Please try again later.',
      details: error.message
    });
  }
});

// Get teacher statistics (admin only)
router.get('/admin/stats', auth, async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      console.log('Database not ready, returning fallback teacher statistics');
      return res.json({
        total: 0,
        active: 0,
        inactive: 0,
        retired: 0,
        departmentStats: [],
        message: 'Database temporarily unavailable - showing fallback data',
        fallback: true
      });
    }
    
    const totalTeachers = await Teacher.countDocuments();
    const activeTeachers = await Teacher.countDocuments({ status: 'active' });
    const inactiveTeachers = await Teacher.countDocuments({ status: 'inactive' });
    const retiredTeachers = await Teacher.countDocuments({ status: 'retired' });
    
    const departmentStats = await Teacher.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          department: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);
    
    res.json({
      total: totalTeachers,
      active: activeTeachers,
      inactive: inactiveTeachers,
      retired: retiredTeachers,
      departmentStats,
      fallback: false
    });
  } catch (error) {
    console.error('Error fetching teacher statistics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch teacher statistics',
      message: 'Database connection issue. Please try again later.',
      fallbackData: {
        total: 0,
        active: 0,
        inactive: 0,
        retired: 0,
        departmentStats: []
      }
    });
  }
});

module.exports = router; 