const express = require('express');
const passport = require('passport');
const {
  apiSeoulCampusEventsController,
  apiEventController,
  apiUserEventReminderStatusController,
  apiUserEventReminderOnController,
  apiUserEventReminderOffController,
  postEventController,
  putEventController,
  deleteEventController,
} = require('../controllers/event.controller');

const router = express.Router();

router.get(
  '/:eventId/reminder',
  passport.authenticate('jwt'),
  apiUserEventReminderStatusController,
);
router.post(
  '/:eventId/reminder',
  passport.authenticate('jwt'),
  apiUserEventReminderOnController,
);
router.delete(
  '/:eventId/reminder',
  passport.authenticate('jwt'),
  apiUserEventReminderOffController,
);

router.get('/:eventId', apiEventController);
router.get('/', apiSeoulCampusEventsController);

router.post('/', passport.authenticate('jwt'), postEventController);
router.put('/:eventId', passport.authenticate('jwt'), putEventController);
router.delete('/:eventId', passport.authenticate('jwt'), deleteEventController);

module.exports = router;
