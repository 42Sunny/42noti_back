const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  host: process.env.HOST || 'http://localhost',
  port: process.env.PORT || 3000,
  fortytwoClientId: process.env.FORTYTWO_CLIENT_ID,
  fortytwoClientSecret: process.env.FORTYTWO_CLIENT_SECRET,
  databasePort: process.env.DATABASE_PORT || 27017,
  databaseHost: process.env.DATABASE_HOST || 'localhost',
  databaseUsername: process.env.DATABASE_USERNAME || '',
  databasePassword: process.env.DATABASE_PASSWORD || '',
  databaseName: process.env.DATABASE_NAME || '42meetup',
};
