const sequelize = require('./config/database');
const HeroSlide = require('./models/HeroSlide');
const Teacher = require('./models/Teacher');
const Student = require('./models/Student');

const seedData = async () => {
  try {
    // Sync database
    await sequelize.sync({ force: false });
    console.log('Database synced successfully');

    // Clear existing data
    await HeroSlide.destroy({ where: {} });
    await Teacher.destroy({ where: {} });
    await Student.destroy({ where: {} });
    console.log('Cleared existing data');

    // Seed Hero Slides
    const heroSlides = [
      {
        title: "Welcome to HIMS Degree College",
        subtitle: "Empowering Future Leaders Since 1995",
        description: "Your gateway to academic excellence, professional success, and personal growth. Join our community of learners and achievers.",
        imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9a1?w=1200&h=600&fit=crop",
        ctaText: "Explore Programs",
        ctaLink: "/apply",
        order: 1,
        isActive: true
      },
      {
        title: "State-of-the-Art Facilities",
        subtitle: "Modern Learning Environment",
        description: "Experience world-class facilities with cutting-edge technology and comfortable learning spaces designed for your success.",
        imageUrl: "https://images.unsplash.com/photo-1523240797358-5c6edf0e3d14?w=1200&h=600&fit=crop",
        ctaText: "Take a Tour",
        ctaLink: "/about",
        order: 2,
        isActive: true
      },
      {
        title: "Expert Faculty & Mentors",
        subtitle: "Learn from the Best",
        description: "Our distinguished faculty brings industry experience and academic excellence to every classroom, guiding you towards your dreams.",
        imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=600&fit=crop",
        ctaText: "Meet Our Faculty",
        ctaLink: "/#teachers",
        order: 3,
        isActive: true
      }
    ];

    await HeroSlide.bulkCreate(heroSlides);
    console.log('Hero slides seeded successfully');

    // Seed Teachers
    const teachers = [
      {
        name: "Dr. Sarah Johnson",
        position: "Dean of Engineering",
        expertise: "Computer Science",
        imageUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
        rating: 4.9,
        description: "Leading expert in artificial intelligence and machine learning with 15+ years of experience.",
        order: 1,
        isActive: true
      },
      {
        name: "Prof. Michael Chen",
        position: "Head of Business School",
        expertise: "Business Administration",
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
        rating: 4.8,
        description: "Former Fortune 500 executive with expertise in strategic management and entrepreneurship.",
        order: 2,
        isActive: true
      },
      {
        name: "Dr. Emily Rodriguez",
        position: "Director of Arts",
        expertise: "Fine Arts",
        imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
        rating: 4.9,
        description: "Internationally acclaimed artist and curator with exhibitions in major galleries worldwide.",
        order: 3,
        isActive: true
      },
      {
        name: "Prof. David Thompson",
        position: "Dean of Sciences",
        expertise: "Physics",
        imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
        rating: 4.7,
        description: "Nobel Prize nominee for groundbreaking research in quantum mechanics and particle physics.",
        order: 4,
        isActive: true
      }
    ];

    await Teacher.bulkCreate(teachers);
    console.log('Teachers seeded successfully');

    // Seed Students (Shining Stars)
    const students = [
      {
        name: "Ahmed Khan",
        program: "FSC Pre-Medical",
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
        achievement: "Top 1% in Medical Entry Test",
        gpa: "3.95",
        quote: "HIMS Degree College provided me with the perfect foundation for my medical career. The faculty's dedication and support were incredible.",
        awards: ["Academic Excellence", "Leadership Award", "Community Service"],
        order: 1,
        isActive: true
      },
      {
        name: "Fatima Ali",
        program: "FSC Engineering",
        imageUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
        achievement: "Gold Medal in Physics Olympiad",
        gpa: "3.98",
        quote: "The engineering program at HIMS prepared me excellently for university. The practical labs and expert guidance made all the difference.",
        awards: ["Physics Excellence", "Innovation Award", "Research Grant"],
        order: 2,
        isActive: true
      },
      {
        name: "Usman Hassan",
        program: "ICS Computer Science",
        imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
        achievement: "National Coding Champion",
        gpa: "3.92",
        quote: "The computer science program at HIMS gave me the skills and confidence to pursue my passion for technology and innovation.",
        awards: ["Programming Excellence", "Innovation Award", "Tech Leadership"],
        order: 3,
        isActive: true
      },
      {
        name: "Ayesha Malik",
        program: "FSC Pre-Medical",
        imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
        achievement: "Merit Position in Medical College",
        gpa: "3.96",
        quote: "The supportive environment and excellent teaching methods at HIMS helped me achieve my dreams of becoming a doctor.",
        awards: ["Academic Excellence", "Merit Scholarship", "Community Service"],
        order: 4,
        isActive: true
      }
    ];

    await Student.bulkCreate(students);
    console.log('Students seeded successfully');

    console.log('All dummy data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData(); 