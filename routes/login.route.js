const express = require('express');
const passport = require('passport');
const env = require('../config');
const { loginReturnController } = require('../controllers/login');

const router = express.Router();

router.get(
  '/42/return',
  passport.authenticate('42', {
    failureRedirect: `https://${env.front.host}/test`,
  }),
  loginReturnController,
);

const authenticate42withCustomCallback = (req, res, next) => {
  passport.authenticate('42', (err, user, info) => {
    console.log('authenticate 42 user: ', user);
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect(`https://${env.front.host}:${env.front.port}/`);
    }
  })(req, res, next);
};

router.get(
  '/42',
  // (req, res, next) => {
  //   console.log('## check if client has cookie: ');
  //   console.log(req.headers.cookie);
  //   console.log('## req.user: ');
  //   console.log(req.user);
  //   next();
  // },
  authenticate42withCustomCallback,
);

router.get('/test', passport.authenticate('jwt'), (req, res) => {
  res.send('jwt!!!');
});

router.use('/', (req, res) => {
  console.log('login route');
  res.send('login route');
});

module.exports = router;
