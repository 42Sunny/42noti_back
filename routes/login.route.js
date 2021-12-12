const express = require('express');
const passport = require('passport');
const env = require('../config');

const router = express.Router();

router.use(
  '/42/return',
  passport.authenticate('42', {
    failureRedirect: '/login',
  }),
  (req, res) => {
    console.log('/login/42/return');
    res.redirect(`http://${env.front.host}:${env.front.port}`);
  },
);

router.use(
  '/42',
  passport.authenticate('42', {
    // scope: ['profile', 'email'],
    // failureRedirect: '/login',
    // session: false,
  }),
  (req, res) => {
    console.log('/login/42');
    console.dir(req);
  },
);

router.use('/', (req, res) => {
  console.log('login route');
  res.send('login route');
});

module.exports = router;
