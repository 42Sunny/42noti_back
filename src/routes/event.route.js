const express = require('express');
const {
  apiSeoulCampusEventsController,
  apiEventController,
} = require('../controllers/event.controller');

const router = express.Router();

router.get('/:eventId', apiEventController);
router.get('/', apiSeoulCampusEventsController);

module.exports = router;
