const createError = require('http-errors');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const context = require('express-http-context');
const env = require('../config');
const logger = require('../utils/winston');
const passport = require('./passport');
const routes = require('../routes');

const clientErrorHandler = (err, req, res, next) => {
  if (req.xhr) {
    res.status(500).send({ error: 'Something failed!' });
    logger.error(`clientErrorHandler: ${err.message}`);
  } else {
    next(err);
  }
};

const errorHandler = (err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = env.NODE_ENV === 'development' ? err : {};

  logger.error(`errorHandler: ${err.message}`);
  res.status(err.status || 500);
};

module.exports = async app => {
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  const combined =
    ':remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';
  const morganFormat = env.NODE_ENV !== 'production' ? 'dev' : combined;
  app.use(morgan(morganFormat, { stream: logger.stream }));

  passport(app);

  app.use(context.middleware);
  app.use(
    cors({
      origin: [
        `${env.back.domain}:${env.back.port}`,
        `${env.frontUrl}`,
        `${env.dev.frontUrl}`,
        `42.fr`,
      ],
      credentials: true,
      exposedHeaders: ['X-Total-Count'],
    }),
  );

  app.use('/', routes);

  app.use((req, res, next) => {
    next(createError(404));
  });

  app.use(clientErrorHandler);
  app.use(errorHandler);

  return app;
};
