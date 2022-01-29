const express = require('express');
const passport = require('passport');

const testRouter = require('./test.route');
const dummyRouter = require('./dummy.route');
const loginRouter = require('./login.route');
const eventRouter = require('./event.route');
const userRouter = require('./user.route');

const { logoutController } = require('../controllers/login.controller');

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
router.get('/logout', logoutController);
router.use('/events', passport.authenticate('jwt', { session: false }), eventRouter);
router.use('/users', passport.authenticate('jwt', { session: false }), userRouter);

router.use('/', (req, res) => {
  res.send('42Event API');
});

module.exports = router;
