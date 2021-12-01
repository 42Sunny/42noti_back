const express = require('express');
const {
  apiCampusController,
  apiUserController,
  apiCampusEventsController,
  apiUserEventsController,
} = require('../../controllers/api');

const router = express.Router();

router
  .route('/status')
  .get((req, res) => {
    res.json({
      message: 'OK',
      timestamp: new Date().toISOString(),
      IP: req.ip,
      URL: req.originalUrl,
    });
  })
  .head((req, res) => {
    res.status(200).end();
  });

router.use('/campus/events', apiCampusEventsController);
router.use('/campus', apiCampusController);
router.use('/user/:intraLoginId/events', apiUserEventsController);
router.use('/user/:intraLoginId', apiUserController);

module.exports = router;
