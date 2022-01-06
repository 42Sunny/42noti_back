const express = require('express');
const testRouter = require('./test.route');
const dummyRouter = require('./dummy.route');
const loginRouter = require('./login.route');
const eventRouter = require('./event.route');
const userRouter = require('./user.route');

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

router.use('/login', loginRouter);
router.use('/events', eventRouter);
router.use('/users', userRouter);

router.use('/', (req, res) => {
  res.send('42Event API');
});

module.exports = router;
