const express = require('express');
const passport = require('passport');
const env = require('../config');
const { loginReturnController } = require('../controllers/login.controller');

const router = express.Router();

router.get(
  '/42/return',
  passport.authenticate('42', {
    failureRedirect: env.frontUrl,
  }),
  loginReturnController,
);

router.get(
  '/42',
  async (req, res, next) => {
    // NOTE: temporary solution
    const jwt = req.cookies[env.cookie.auth];
    console.log('`/42` req.isAuthenticated:', req.isAuthenticated());

    if (jwt || req.isAuthenticated()) {
      console.log('req.user: ', req.user);
      return res.redirect(env.frontUrl);
    }
    next();
  },
  passport.authenticate('42', {
    failureRedirect: env.frontUrl,
  }),

);

module.exports = router;
