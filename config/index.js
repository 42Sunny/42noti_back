const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  port: process.env.PORT || 3000,
  // databaseURL: process.env.DATABASE_URI || 'mongodb://localhost/url-shortener',
};
