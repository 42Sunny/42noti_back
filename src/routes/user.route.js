const express = require('express');
const passport = require('passport');

const {
  userDataController,
  myUserDataController,
} = require('../controllers/user.controller');
const {
  myEventsController,
  userEventsController,
} = require('../controllers/userEvent.controller');

const router = express.Router();

router.get(
  '/my/events',
  passport.authenticate('jwt', { session: false }),
  myEventsController,
);
router.get('/my', passport.authenticate('jwt', { session: false }), myUserDataController);
router.get('/:intraUsername/events', userEventsController);
router.get('/:intraUsername', userDataController);

module.exports = router;
