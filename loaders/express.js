const createError = require('http-errors');
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const logger = require('./winston');
const env = require('../config');

const combined = ':remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';
const morganFormat = env.NODE_ENV !== 'production' ? 'dev' : combined;
console.log(morganFormat);
const routes = require('../routes');

module.exports = async (app) => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use(express.static(path.join(__dirname, 'public')));
  app.use(morgan(morganFormat, { stream: logger.stream }));

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
