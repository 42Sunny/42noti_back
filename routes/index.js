const express = require('express');
const testRouter = require('./test.route');
const dummyRouter = require('./dummy.route');
const apiRouter = require('./api');
const loginRouter = require('./login.route');

const router = express.Router();

router.use('/test', testRouter);
router.use('/dummy', dummyRouter);

router.use('/api', apiRouter);
router.use('/login', loginRouter);

router.use('/', (req, res) => {
  res.send('42Meetup API');
})

module.exports = router;
