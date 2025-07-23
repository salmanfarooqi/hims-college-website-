const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Direct MongoDB connection without complex options
const MONGODB_URI = 'mongodb+srv://salmanfarooqi1272001:zEGciWrm7uBCYTLt@cluster0.gitehdr.mongodb.net/hims-college';

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'super_admin'],
    default: 'admin'
  }
}, {
  timestamps: true
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const Admin = mongoose.model('Admin', adminSchema);

const createAdminDirect = async () => {
  try {
    console.log('Attempting direct MongoDB connection...');
    
    // Try simple connection first
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    
    console.log('Connected to MongoDB successfully!');
    
    // Check if admin exists
    console.log('Checking for existing admin...');
    const existingAdmin = await Admin.findOne({ email: 'hims@gmail.com' });
    
    if (existingAdmin) {
      console.log('✅ Admin already exists:');
      console.log('   Email:', existingAdmin.email);
      console.log('   Name:', existingAdmin.name);
      console.log('   Role:', existingAdmin.role);
      console.log('   Created:', existingAdmin.createdAt);
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
    console.log('✅ Admin created successfully!');
    console.log('   Email: hims@gmail.com');
    console.log('   Password: hims123');
    console.log('   Name: HIMS College Administrator');
    console.log('   Role: super_admin');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // If connection fails, try alternative approach
    if (error.message.includes('ETIMEOUT') || error.message.includes('queryTxt')) {
      console.log('\n🔄 Trying alternative connection method...');
      try {
        await mongoose.disconnect();
        await mongoose.connect(MONGODB_URI, {
          maxPoolSize: 1,
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 10000,
          connectTimeoutMS: 10000,
          retryWrites: true,
          w: 'majority'
        });
        console.log('✅ Alternative connection successful!');
        
        // Try admin creation again
        const admin = new Admin({
          email: 'hims@gmail.com',
          password: 'hims123',
          name: 'HIMS College Administrator',
          role: 'super_admin'
        });
        
        await admin.save();
        console.log('✅ Admin created successfully with alternative connection!');
        
      } catch (altError) {
        console.error('❌ Alternative connection also failed:', altError.message);
        console.log('\n💡 Suggestion: Check your internet connection or try again later.');
      }
    }
  } finally {
    try {
      await mongoose.disconnect();
      console.log('Database connection closed.');
    } catch (e) {
      // Ignore disconnect errors
    }
    process.exit(0);
  }
};

createAdminDirect(); 