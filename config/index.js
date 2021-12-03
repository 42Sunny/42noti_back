const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  port: process.env.PORT || 3000,
  fortytwoClientId: process.env.FORTYTWO_CLIENT_ID,
  fortytwoClientSecret: process.env.FORTYTWO_CLIENT_SECRET,
  slack_bot_token: process.env.SLACK_BOT_TOKEN,
  slack_signing_secret: process.env.SLACK_SIGNING_SECRET,
};
