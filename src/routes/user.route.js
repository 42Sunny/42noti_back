const express = require('express');
const passport = require('passport');

const {
  apiUserDataController,
  apiMyUserDataController,
} = require('../controllers/user.controller');
const {
  apiMyEventsController,
  apiUserEventsController,
} = require('../controllers/event.controller');

const router = express.Router();

router.get('/my/events', passport.authenticate('jwt'), apiMyEventsController);
router.get('/my', passport.authenticate('jwt'), apiMyUserDataController);
router.get('/:intraUsername/events', apiUserEventsController);
router.get('/:intraUsername', apiUserDataController);

module.exports = router;
