const express = require('express');

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

router.get('/:eventId/reminder', userEventReminderStatusController);
router.post('/:eventId/reminder', userEventReminderOnController);
router.delete('/:eventId/reminder', userEventReminderOffController);

router.get('/:eventId', eventController);
router.get('/', eventsController);

router.post('/', postEventController);
router.put('/:eventId', putEventController);
router.delete('/:eventId', deleteEventController);

module.exports = router;
