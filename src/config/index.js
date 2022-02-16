const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  NODE_ENV:
    process.env.NODE_ENV &&
    process.env.NODE_ENV.trim().toLowerCase() == 'production'
      ? 'production'
      : 'development',
  back: {
    domain: process.env.BACK_DOMAIN || 'http://localhost',
    port: process.env.BACK_PORT || 4242,
  },
  frontUrl: process.env.FRONT_URL || 'http://localhost:3000',
  dev: {
    back: {
      domain: process.env.DEV_BACK_DOMAIN || 'http://localhost',
      port: process.env.DEV_BACK_PORT || 4242,
    },
    frontUrl: process.env.DEV_FRONT_URL || 'http://localhost:3000',
  },
  db: {
    port: process.env.DATABASE_PORT || 27017,
    host: process.env.DATABASE_HOST || 'localhost',
    username: process.env.DATABASE_USERNAME || '',
    password: process.env.DATABASE_PASSWORD || '',
    name: process.env.DATABASE_NAME || '42meetup',
  },
  cookie: {
    domain: process.env.COOKIE_DOMAIN || 'localhost',
    secret: process.env.COOKIE_SECRET || 'test-fortytwo-meetup-secret',
    auth: process.env.COOKIE_AUTH || 'w_auth_local',
  },
  fortytwoApi: {
    clientId: process.env.FORTYTWO_CLIENT_ID,
    clientSecret: process.env.FORTYTWO_CLIENT_SECRET,
    redirectUri:
      process.env.FORTYTWO_REDIRECT ||
      `${process.env.BACK_DOMAIN}${
        process.env.BACK_PORT ? `:${process.env.BACK_PORT}` : ''
      }/login/42/return`,
  },
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN,
    secret: process.env.SLACK_SIGNING_SECRET,
  },
};
