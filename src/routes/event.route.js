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
  passport.authenticate('jwt', { session: false }),
  apiUserEventReminderStatusController,
);
router.post(
  '/:eventId/reminder',
  passport.authenticate('jwt', { session: false }),
  apiUserEventReminderOnController,
);
router.delete(
  '/:eventId/reminder',
  passport.authenticate('jwt', { session: false }),
  apiUserEventReminderOffController,
);

router.get('/:eventId', apiEventController);
router.get('/', apiSeoulCampusEventsController);

router.post('/', passport.authenticate('jwt', { session: false }), postEventController);
router.put('/:eventId', passport.authenticate('jwt', { session: false }), putEventController);
router.delete('/:eventId', passport.authenticate('jwt', { session: false }), deleteEventController);

module.exports = router;
