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
      console.log('Database not ready, returning empty array');
      return res.json([]);
    }
    
    const teachers = await Teacher.find({ status: 'active' })
      .select('-__v')
      .sort({ lastName: 1, firstName: 1 });
    
    console.log(`Returning ${teachers.length} active teachers`);
    res.json(teachers);
    
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

// Get teacher by ID (public)
router.get('/:id', async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const teacher = await Teacher.findById(req.params.id).select('-__v');
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    res.json(teacher);
  } catch (error) {
    console.error('Error fetching teacher:', error);
    res.status(500).json({ error: 'Failed to fetch teacher' });
  }
});

// Admin endpoints for teachers
router.get('/admin/all', auth, async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const teachers = await Teacher.find()
      .select('-__v')
      .sort({ lastName: 1, firstName: 1 });
    
    res.json(teachers);
  } catch (error) {
    console.error('Error fetching admin teachers:', error);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

// Create new teacher (admin only)
router.post('/admin', auth, async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const teacher = new Teacher(req.body);
    await teacher.save();
    
    res.status(201).json({ message: 'Teacher created successfully', teacher });
  } catch (error) {
    console.error('Error creating teacher:', error);
    res.status(500).json({ error: 'Failed to create teacher' });
  }
});

// Update teacher (admin only)
router.put('/admin/:id', auth, async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    res.json({ message: 'Teacher updated successfully', teacher });
  } catch (error) {
    console.error('Error updating teacher:', error);
    res.status(500).json({ error: 'Failed to update teacher' });
  }
});

// Delete teacher (admin only)
router.delete('/admin/:id', auth, async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    res.status(500).json({ error: 'Failed to delete teacher' });
  }
});

// Get teacher statistics (admin only)
router.get('/admin/stats', auth, async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: 'Database not available' });
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
      departmentStats
    });
  } catch (error) {
    console.error('Error fetching teacher statistics:', error);
    res.status(500).json({ error: 'Failed to fetch teacher statistics' });
  }
});

module.exports = router; 