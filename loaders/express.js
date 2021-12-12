const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');
const env = require('../config');
const logger = require('./winston');
const passport = require('./passport');

const combined =
  ':remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';
const morganFormat = env.NODE_ENV !== 'production' ? 'dev' : combined;
console.log(morganFormat);
const routes = require('../routes');

module.exports = async app => {
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use(morgan(morganFormat, { stream: logger.stream }));
  app.use(
    session({ resave: false, saveUninitialized: false, secret: '!Seoul' }),
  );
  app.use(express.static(path.join(__dirname, 'public')));

  passport(app);

  app.use('/', routes);

  app.use((req, res, next) => {
    next(createError(404));
  });

  app.use((err, req, res) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);
  });

  return app;
};
