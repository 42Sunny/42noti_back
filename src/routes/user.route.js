const express = require('express');

const {
  userDataController,
  myUserDataController,
} = require('../controllers/user.controller');
const {
  myEventsController,
  userEventsController,
} = require('../controllers/userEvent.controller');

const router = express.Router();

router.get('/my/events', myEventsController);
router.get('/my', myUserDataController);
router.get('/:intraUsername/events', userEventsController);
router.get('/:intraUsername', userDataController);

module.exports = router;
