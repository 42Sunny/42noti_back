const express = require('express');
const testRouter = require('./test.route');
const dummyRouter = require('./dummy.route');

const router = express.Router();

router
  .route('/status')
  .get((req, res) => {
    res.json({
      message: 'OK',
      timestamp: new Date().toISOString(),
      IP: req.ip,
      URL: req.originalUrl,
    });
  })
  .head((req, res) => {
    res.status(200).end();
  });

router.use('/test', testRouter);

router.use('/dummy', dummyRouter);

module.exports = router;
