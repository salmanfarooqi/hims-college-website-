const { connectDB, closeConnection, isConnected } = require('../config/database');

describe('Database Connection', () => {
  test('should connect to database', async () => {
    // The connection is already established in setup.js
    expect(isConnected()).toBe(true);
  });

  test('should handle connection retry logic', async () => {
    // Test with invalid URI
    const originalUri = process.env.MONGODB_URI;
    process.env.MONGODB_URI = 'mongodb://invalid:27017/test';
    
    const result = await connectDB(1); // Only 1 retry
    expect(result).toBeNull(); // Should return null on failure
    
    // Restore original URI
    process.env.MONGODB_URI = originalUri;
  });
}); 