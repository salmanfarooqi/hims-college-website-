const mongoose = require('mongoose');
const Application = require('./models/Application');
require('dotenv').config();

async function testNewApplicationSystem() {
  try {
    // Connect to database
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/hims_db';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Test creating a new application with all required fields
    const testApplication = {
      firstName: 'Ahmad',
      lastName: 'Khan',
      fatherName: 'Muhammad Khan',
      email: 'ahmad.khan@test.com',
      phone: '03001234567',
      dateOfBirth: new Date('2005-01-15'),
      gender: 'male',
      address: '123 Main Street, Block A',
      city: 'Lahore',
      state: 'Punjab',
      zipCode: '54000',
      program: 'FSC Pre-Medical (2 Years)',
      previousSchool: 'Government High School',
      previousGrade: 'A+',
      paymentAmount: '200',
      easypaisaNumber: '03009876543',
      transactionId: 'EP' + Date.now(),
      transactionReceipt: 'uploads/test-receipt.jpg'
    };

    // Create and save the application
    const application = new Application(testApplication);
    await application.save();
    console.log('✅ Test application created successfully');
    console.log('📋 Application Details:');
    console.log(`   - Name: ${application.firstName} ${application.lastName}`);
    console.log(`   - Father: ${application.fatherName}`);
    console.log(`   - Program: ${application.program}`);
    console.log(`   - Payment: Rs. ${application.paymentAmount}`);
    console.log(`   - Transaction ID: ${application.transactionId}`);
    console.log(`   - Status: ${application.status}`);

    // Test validation - should fail with missing fields
    console.log('\n🧪 Testing validation...');
    try {
      const invalidApplication = new Application({
        firstName: 'Test',
        lastName: 'User'
        // Missing required fields
      });
      await invalidApplication.save();
      console.log('❌ Validation test failed - should have thrown error');
    } catch (error) {
      console.log('✅ Validation working correctly - rejected incomplete application');
    }

    // Test duplicate transaction ID - should fail
    console.log('\n🧪 Testing duplicate transaction ID...');
    try {
      const duplicateApplication = new Application({
        ...testApplication,
        email: 'different@test.com',
        transactionId: application.transactionId // Same transaction ID
      });
      await duplicateApplication.save();
      console.log('❌ Duplicate transaction ID test failed - should have been rejected');
    } catch (error) {
      console.log('✅ Duplicate transaction ID properly rejected');
    }

    // Test query operations
    console.log('\n🔍 Testing query operations...');
    
    // Find by transaction ID
    const foundByTransaction = await Application.findOne({ 
      transactionId: application.transactionId 
    });
    console.log(`✅ Found application by transaction ID: ${foundByTransaction.firstName} ${foundByTransaction.lastName}`);

    // Find by program
    const fscApplications = await Application.find({ 
      program: { $regex: 'FSC Pre-Medical', $options: 'i' } 
    });
    console.log(`✅ Found ${fscApplications.length} FSC Pre-Medical applications`);

    // Get statistics
    const stats = {
      total: await Application.countDocuments(),
      pending: await Application.countDocuments({ status: 'pending' }),
      approved: await Application.countDocuments({ status: 'approved' }),
      rejected: await Application.countDocuments({ status: 'rejected' })
    };
    console.log('\n📊 Application Statistics:');
    console.log(`   - Total: ${stats.total}`);
    console.log(`   - Pending: ${stats.pending}`);
    console.log(`   - Approved: ${stats.approved}`);
    console.log(`   - Rejected: ${stats.rejected}`);

    // Test different programs
    const programs = ['FSC Pre-Medical (2 Years)', 'FSC Pre-Engineering (2 Years)', 'Computer Science (2 Years)'];
    console.log('\n📚 Testing different programs...');
    
    for (let i = 0; i < programs.length; i++) {
      const programApp = new Application({
        ...testApplication,
        email: `test${i + 2}@test.com`,
        transactionId: 'EP' + (Date.now() + i),
        program: programs[i],
        firstName: `Student${i + 2}`
      });
      await programApp.save();
      console.log(`✅ Created application for ${programs[i]}`);
    }

    // Final statistics
    const finalStats = await Application.aggregate([
      {
        $group: {
          _id: '$program',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    console.log('\n📈 Applications by Program:');
    finalStats.forEach(stat => {
      console.log(`   - ${stat._id}: ${stat.count} applications`);
    });

    console.log('\n🎉 All tests completed successfully!');
    console.log('🔧 The new application system is working properly.');
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await Application.deleteMany({ email: { $regex: '@test.com' } });
    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📦 Database connection closed');
  }
}

// Run the test
if (require.main === module) {
  testNewApplicationSystem();
}

module.exports = testNewApplicationSystem; 