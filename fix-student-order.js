const mongoose = require('mongoose');
const Student = require('./models/Student');
require('./config/database');

async function fixStudentOrder() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hims-college');
    console.log('Connected to database');

    // Get all students
    const students = await Student.find({});
    console.log(`Found ${students.length} students`);

    // Update each student with a default order value
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      if (student.order === undefined || student.order === null) {
        student.order = i + 1; // Start from 1
        await student.save();
        console.log(`Updated student ${student.firstName} ${student.lastName} with order ${student.order}`);
      }
    }

    console.log('All students updated with order values');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixStudentOrder(); 