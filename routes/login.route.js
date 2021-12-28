const express = require('express');
const passport = require('passport');
const env = require('../config');
const { loginReturnController } = require('../controllers/login');

const router = express.Router();

router.get(
  '/42/return',
  passport.authenticate('42', {
    failureRedirect: `/login`,
  }),
  loginReturnController,
);

const authenticate42withCustomCallback = (req, res, next) => {
  passport.authenticate('42', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect(env.frontUrl);
    }
  })(req, res, next);
};

router.get(
  '/42',
  authenticate42withCustomCallback,
);

module.exports = router;
