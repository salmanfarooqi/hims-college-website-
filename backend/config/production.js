// Production configuration for Vercel deployment
// All environment variables are hardcoded for production

const config = {
  // Database Configuration
  database: {
    host: 'ep-autumn-darkness-adbsao3t-pooler.c-2.us-east-1.aws.neon.tech',
    port: 5432,
    name: 'neondb',
    user: 'neondb_owner',
    password: 'npg_WzwxXjSA39Lu',
    ssl: 'require'
  },

  // Server Configuration
  server: {
    port: process.env.PORT || 5000,
    nodeEnv: 'production'
  },

  // JWT Configuration
  jwt: {
    secret: 'hims_college_jwt_secret_key_2024'
  },

  // Admin Credentials
  admin: {
    email: 'hims@gmail.com',
    password: 'hims123'
  },

  // Cloudinary Configuration
  cloudinary: {
    cloudName: 'dwtru703l',
    apiKey: '964741116272599',
    apiSecret: 'QckGC-axVOaemElOzmt50-rDepA'
  }
};

module.exports = config; 