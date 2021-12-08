const express = require('express');
const passport = require('passport');

const router = express.Router();

router.use(
  '/42/return',
  passport.authenticate('42', {
    failureRedirect: '/login',
  }),
  (req, res) => {
    res.redirect('/');
  },
);

router.use(
  '/42',
  passport.authenticate('42', {
    // scope: ['profile', 'email'],
    // failureRedirect: '/login',
    // session: false,
  }),
);

router.use('/', (req, res) => {
  console.log('login route');
  res.send('login route');
});

module.exports = router;
