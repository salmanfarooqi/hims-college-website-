const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

// Import models
const HeroSlide = require('./models/HeroSlide');
const Teacher = require('./models/Teacher');
const Student = require('./models/Student');
const Admin = require('./models/Admin');

const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    const conn = await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: 'majority'
    });
    
    console.log('✅ Connected to MongoDB successfully!');
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️ Clearing existing data...');
    await HeroSlide.deleteMany({});
    await Teacher.deleteMany({});
    await Student.deleteMany({});
    
    // Seed Hero Slides
    console.log('📸 Creating hero slides...');
    const heroSlides = [
      {
        title: 'Welcome to HIMS Degree College',
        subtitle: 'Excellence in Education',
        description: 'Empowering students with quality education and modern facilities for a brighter future.',
        imageUrl: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200&h=600&fit=crop',
        order: 1,
        isActive: true
      },
      {
        title: 'State-of-the-Art Facilities',
        subtitle: 'Modern Learning Environment',
        description: 'Equipped with the latest technology and resources to enhance your learning experience.',
        imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1200&h=600&fit=crop',
        order: 2,
        isActive: true
      },
      {
        title: 'Expert Faculty Members',
        subtitle: 'Learn from the Best',
        description: 'Our experienced professors and industry experts are committed to your academic success.',
        imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&h=600&fit=crop',
        order: 3,
        isActive: true
      }
    ];

    await HeroSlide.insertMany(heroSlides);
    console.log(`✅ Created ${heroSlides.length} hero slides`);

    // Seed Teachers
    console.log('👩‍🏫 Creating teachers...');
    const teachers = [
      {
        name: 'Dr. Sarah Johnson',
        position: 'Dean of Engineering',
        expertise: 'Computer Science',
        description: 'Leading expert in artificial intelligence and machine learning with 15+ years of experience.',
        rating: 4.9,
        order: 1,
        imageUrl: 'https://images.unsplash.com/photo-1494790108755-2616c6dc15d2?w=400&h=400&fit=crop&crop=face',
        isActive: true,
        email: 'sarah.johnson@hims.edu',
        phone: '+92-300-1234567',
        department: 'Computer Science',
        qualifications: 'PhD in Computer Science, MIT',
        experience: '15+ years in AI and Machine Learning'
      },
      {
        name: 'Prof. Michael Chen',
        position: 'Head of Business School',
        expertise: 'Business Administration',
        description: 'Former Fortune 500 executive with expertise in strategic management and entrepreneurship.',
        rating: 4.8,
        order: 2,
        imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
        isActive: true,
        email: 'michael.chen@hims.edu',
        phone: '+92-300-2345678',
        department: 'Business Administration',
        qualifications: 'MBA Harvard, CPA',
        experience: '20+ years in corporate leadership'
      },
      {
        name: 'Dr. Emily Rodriguez',
        position: 'Director of Arts',
        expertise: 'Fine Arts',
        description: 'Internationally acclaimed artist and curator with exhibitions in major galleries worldwide.',
        rating: 4.9,
        order: 3,
        imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
        isActive: true,
        email: 'emily.rodriguez@hims.edu',
        phone: '+92-300-3456789',
        department: 'Fine Arts',
        qualifications: 'MFA Yale School of Art',
        experience: '12+ years in contemporary art'
      },
      {
        name: 'Prof. David Thompson',
        position: 'Dean of Sciences',
        expertise: 'Physics',
        description: 'Nobel Prize nominee for groundbreaking research in quantum mechanics and particle physics.',
        rating: 4.7,
        order: 4,
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
        isActive: true,
        email: 'david.thompson@hims.edu',
        phone: '+92-300-4567890',
        department: 'Physics',
        qualifications: 'PhD in Theoretical Physics, Oxford',
        experience: '18+ years in quantum research'
      },
      {
        name: 'Dr. Aisha Khan',
        position: 'Head of Medical Sciences',
        expertise: 'Biology & Chemistry',
        description: 'Renowned researcher in biochemistry with numerous publications in international journals.',
        rating: 4.8,
        order: 5,
        imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
        isActive: true,
        email: 'aisha.khan@hims.edu',
        phone: '+92-300-5678901',
        department: 'Medical Sciences',
        qualifications: 'PhD in Biochemistry, Cambridge',
        experience: '10+ years in medical research'
      }
    ];

    await Teacher.insertMany(teachers);
    console.log(`✅ Created ${teachers.length} teachers`);

    // Seed Students (Shining Stars)
    console.log('⭐ Creating student shining stars...');
    const students = [
      {
        firstName: 'Ahmed',
        lastName: 'Khan',
        email: 'ahmed.khan@student.hims.edu',
        phone: '+92-301-1111111',
        dateOfBirth: new Date('2003-05-15'),
        gender: 'male',
        program: 'FSC Pre-Medical',
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
        gpa: '3.95',
        achievement: 'Top 1% in Medical Entry Test',
        quote: 'HIMS Degree College provided me with the perfect foundation for my medical career. The faculty\'s dedication and support were incredible.',
        awards: ['Academic Excellence', 'Leadership Award', 'Community Service']
      },
      {
        firstName: 'Fatima',
        lastName: 'Ali',
        email: 'fatima.ali@student.hims.edu',
        phone: '+92-301-2222222',
        dateOfBirth: new Date('2003-08-22'),
        gender: 'female',
        program: 'FSC Pre-Engineering',
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1494790108755-2616c6dc15d2?w=400&h=400&fit=crop&crop=face',
        gpa: '3.98',
        achievement: 'Gold Medal in Physics Olympiad',
        quote: 'The engineering program at HIMS prepared me excellently for university. The practical labs and expert guidance made all the difference.',
        awards: ['Physics Excellence', 'Innovation Award', 'Research Grant']
      },
      {
        firstName: 'Hassan',
        lastName: 'Ahmed',
        email: 'hassan.ahmed@student.hims.edu',
        phone: '+92-301-3333333',
        dateOfBirth: new Date('2003-03-10'),
        gender: 'male',
        program: 'Computer Science',
        status: 'graduated',
        imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
        gpa: '3.92',
        achievement: 'National Programming Champion',
        quote: 'HIMS gave me the skills and confidence to excel in the tech industry. Now I\'m working at a leading software company.',
        awards: ['Programming Excellence', 'Tech Innovation', 'Dean\'s List']
      },
      {
        firstName: 'Zara',
        lastName: 'Sheikh',
        email: 'zara.sheikh@student.hims.edu',
        phone: '+92-301-4444444',
        dateOfBirth: new Date('2003-11-05'),
        gender: 'female',
        program: 'Business Administration',
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
        gpa: '3.89',
        achievement: 'Young Entrepreneur of the Year',
        quote: 'The business program at HIMS taught me not just theory but practical skills. I started my own company during my final year.',
        awards: ['Entrepreneurship Award', 'Business Plan Winner', 'Leadership Excellence']
      },
      {
        firstName: 'Omar',
        lastName: 'Malik',
        email: 'omar.malik@student.hims.edu',
        phone: '+92-301-5555555',
        dateOfBirth: new Date('2003-07-18'),
        gender: 'male',
        program: 'Arts & Literature',
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
        gpa: '3.85',
        achievement: 'Published Author & Poet',
        quote: 'HIMS nurtured my creative talents and helped me discover my passion for writing. My professors encouraged me to publish my first book.',
        awards: ['Creative Writing Award', 'Literary Excellence', 'Cultural Ambassador']
      }
    ];

    await Student.insertMany(students);
    console.log(`✅ Created ${students.length} students`);

    // Create/Update Admin (if not exists)
    console.log('👤 Setting up admin account...');
    const existingAdmin = await Admin.findOne({ email: 'hims@gmail.com' });
    if (!existingAdmin) {
      const admin = new Admin({
        email: 'hims@gmail.com',
        password: 'hims123', // This will be hashed by the pre-save middleware
        name: 'HIMS College Administrator',
        role: 'super_admin'
      });
      await admin.save();
      console.log('✅ Created admin account');
    } else {
      console.log('✅ Admin account already exists');
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   📸 Hero Slides: ${heroSlides.length} created`);
    console.log(`   👩‍🏫 Teachers: ${teachers.length} created`);
    console.log(`   ⭐ Students: ${students.length} created`);
    console.log(`   👤 Admin: hims@gmail.com / hims123`);
    console.log('');
    console.log('🚀 You can now:');
    console.log('   1. Start the backend: node server.js');
    console.log('   2. Start the frontend: npm run dev');
    console.log('   3. Login to admin with: hims@gmail.com / hims123');
    console.log('   4. View teachers, students, and hero slides on the website');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📊 Database connection closed');
    process.exit(0);
  }
};

// Run the seeding
seedData(); 