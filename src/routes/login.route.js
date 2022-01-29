const express = require('express');
const passport = require('passport');
const env = require('../config');
const { loginReturnController } = require('../controllers/login.controller');

const router = express.Router();

router.get(
  '/42/return',
  passport.authenticate('42', {
    failureRedirect: env.frontUrl,
    session: false,
  }),
  loginReturnController,
);

router.get(
  '/42',
  async (req, res, next) => {
    // NOTE: temporary solution
    const jwt = req.cookies[env.cookie.auth];

    if (jwt) {
      return res.redirect(env.frontUrl);
    }
    next();
  },
  passport.authenticate('42', {
    failureRedirect: env.frontUrl,
    session: false,
  })
);

module.exports = router;
