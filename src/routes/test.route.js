const express = require('express');
const path = require('path');
const logger = require('../loaders/winston');

const router = express.Router();

// log test
router.get('/info', (req, res, next) => {
  logger.info('info test');
  res.status(200).send({
    message: 'info test!',
  });
});

router.get('/warn', (req, res, next) => {
  logger.warn('warning test');
  res.status(400).send({
    message: 'warning test!',
  });
});

router.get('/error', (req, res, next) => {
  logger.error('error test');
  res.status(500).send({
    message: 'error test!',
  });
});

router.use('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/test.html'));
});
module.exports = router;
