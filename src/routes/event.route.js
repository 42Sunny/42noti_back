const express = require('express');
const passport = require('passport');
const {
  eventsController,
  eventController,
  postEventController,
  putEventController,
  deleteEventController,
} = require('../controllers/event.controller');
const {
  userEventReminderStatusController,
  userEventReminderOnController,
  userEventReminderOffController,
} = require('../controllers/userEvent.controller');

const router = express.Router();

router.get(
  '/:eventId/reminder',
  passport.authenticate('jwt', { session: false }),
  userEventReminderStatusController,
);
router.post(
  '/:eventId/reminder',
  passport.authenticate('jwt', { session: false }),
  userEventReminderOnController,
);
router.delete(
  '/:eventId/reminder',
  passport.authenticate('jwt', { session: false }),
  userEventReminderOffController,
);

router.get('/:eventId', eventController);
router.get('/', eventsController);

router.post('/', passport.authenticate('jwt', { session: false }), postEventController);
router.put('/:eventId', passport.authenticate('jwt', { session: false }), putEventController);
router.delete('/:eventId', passport.authenticate('jwt', { session: false }), deleteEventController);

module.exports = router;
