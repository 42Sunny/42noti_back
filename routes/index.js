const express = require('express');
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
const testRouter = require('./test.route');
const dummyRouter = require('./dummy.route');
const apiRouter = require('./api');
const loginRouter = require('./login.route');

const router = express.Router();

router.use('/test', testRouter);
router.use('/dummy', dummyRouter);

router.use('/api', apiRouter);
router.use('/login', loginRouter);

router.get('/profile', ensureLoggedIn(), function (req, res) {
  res.send(req.user);
});

router.use('/', (req, res) => {
  res.send('42Meetup!');
})


module.exports = router;
