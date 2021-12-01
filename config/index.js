const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  port: process.env.PORT || 3000,
  fortytwoClientId: process.env.FORTYTWO_CLIENT_ID,
  fortytwoClientSecret: process.env.FORTYTWO_CLIENT_SECRET,
  // databaseURL: process.env.DATABASE_URI || 'mongodb://localhost/url-shortener',
};
