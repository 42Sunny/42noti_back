const express = require('express');
const loaders = require('./loaders');
const env = require('./config');
const logger = require('./utils/winston');

const startServer = async () => {
  const app = express();

  await loaders(app);

  app.listen(env.back.port, err => {
    if (err) {
      console.error(err);
      return;
    }
    logger.info(`===================`);
    logger.info(`Server listening...`);
    logger.info(`NODE_ENV: ${env.NODE_ENV}`);
    logger.info(`🚀 ${env.back.domain}:${env.back.port}`);
    logger.info(`===================`);
  });
}

startServer();
