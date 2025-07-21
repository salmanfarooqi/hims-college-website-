const { Sequelize } = require('sequelize');
const config = require('./production');

let sequelize;

try {
  // Explicitly require pg to ensure it's loaded
  require('pg');
  
  sequelize = new Sequelize(
    config.database.name,
    config.database.user,
    config.database.password,
    {
      host: config.database.host,
      port: config.database.port,
      dialect: 'postgres',
      logging: config.server.nodeEnv === 'development' ? console.log : false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );

  // Test the connection
  sequelize.authenticate()
    .then(() => {
      console.log('Database connection established successfully.');
    })
    .catch(err => {
      console.error('Unable to connect to the database:', err);
    });

} catch (error) {
  console.error('Error initializing database:', error);
  // Create a fallback sequelize instance
  sequelize = new Sequelize('sqlite::memory:', {
    logging: false
  });
}

module.exports = sequelize; 