const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  back: {
    host: process.env.BACK_HOST || 'localhost',
    port: process.env.BACK_PORT || 4242,
  },
  front: {
    host: process.env.FRONT_HOST || 'localhost',
    port: process.env.FRONT_PORT || 3000,
  },
  fortytwoClientId: process.env.FORTYTWO_CLIENT_ID,
  fortytwoClientSecret: process.env.FORTYTWO_CLIENT_SECRET,
  databasePort: process.env.DATABASE_PORT || 27017,
  databaseHost: process.env.DATABASE_HOST || 'localhost',
  databaseUsername: process.env.DATABASE_USERNAME || '',
  databasePassword: process.env.DATABASE_PASSWORD || '',
  databaseName: process.env.DATABASE_NAME || '42meetup',
  jwtSecret: process.env.JWT_SECRET || 'test-fortytwo-meetup-secret',
  cookieAuth: process.env.COOKIE_AUTH || 'w_auth_local',
};
