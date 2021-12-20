const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const context = require('express-http-context');
const session = require('express-session');
const env = require('../config');
const logger = require('./winston');
const passport = require('./passport');

const combined =
  ':remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';
const morganFormat = env.NODE_ENV !== 'production' ? 'dev' : combined;
console.log(morganFormat);
const routes = require('../routes');

const clientErrorHandler = (err, req, res, next) => {
  if (req.xhr) {
    res.status(500).send({ error: 'Something failed!' });
  } else {
    next(err);
  }
};

const errorHandler= (err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
};

module.exports = async app => {
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use(morgan(morganFormat, { stream: logger.stream }));
  app.use(
    session({secret: `meetup`, resave: false, saveUninitialized: false}),
  );

  passport(app);


  app.use(context.middleware);
  app.use(
    cors({
      origin: [
        `${env.back.host}:${env.back.port}`,
        `${env.front.host}:${env.front.port}`,
        `42.fr`,
      ],
      credentials: true,
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
