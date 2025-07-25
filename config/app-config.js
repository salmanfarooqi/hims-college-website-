// Application Configuration - Hardcoded values (no environment variables needed)
module.exports = {
  // MongoDB Configuration
  MONGODB_URI: 'mongodb://salmanfarooqi1272001:lFib5Wx53XzA69f1@ac-2w2swh3-shard-00-00.y65wznf.mongodb.net:27017,ac-2w2swh3-shard-00-01.y65wznf.mongodb.net:27017,ac-2w2swh3-shard-00-02.y65wznf.mongodb.net:27017/?ssl=true&replicaSet=atlas-cx2x9d-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0',
  
  // JWT Configuration
  JWT_SECRET: 'Fv@9s6*PpZ4K#8wzv&1qA0xL6mJp9d6T%yNm7!zD5P@+H9uE#QwVk2oR#WJ5e6',
  
  // Admin Configuration
  ADMIN_EMAIL: 'hims@gmail.com',
  ADMIN_PASSWORD: 'hims123',
  
  // Server Configuration
  PORT: 5000,
  NODE_ENV: 'production',
  
  // Security Configuration
  RATE_LIMIT_WINDOW_MS: 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,
  
  // Database Options
  DB_OPTIONS: {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    retryWrites: true,
    w: 'majority'
  }
}; 