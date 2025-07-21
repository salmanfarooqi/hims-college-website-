const sequelize = require('./config/database');
const Admin = require('./models/Admin');
const config = require('./config/production');

const setupAdmin = async () => {
  try {
    // Sync database
    await sequelize.sync({ force: false });
    console.log('Database synced successfully');

    // Check if admin already exists
    const adminCount = await Admin.count();
    if (adminCount > 0) {
      console.log('Admin account already exists');
      process.exit(0);
    }

    // Create admin account
    const admin = await Admin.create({
      email: config.admin.email,
      password: config.admin.password,
      name: 'HIMS College Administrator',
      role: 'super_admin'
    });

    console.log('Admin account created successfully');
    console.log('Email:', admin.email);
    console.log('Password:', config.admin.password);
    process.exit(0);
  } catch (error) {
    console.error('Failed to setup admin:', error);
    process.exit(1);
  }
};

setupAdmin(); 