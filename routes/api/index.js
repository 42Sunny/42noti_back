const express = require('express');
const {
  apiCampusController,
  apiUserController,
  apiSeoulCampusEventsController,
  apiEventController,
  apiUserEventsController,
} = require('../../controllers/api');
const { get42Api } = require('../../utils/42api');

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

router.use('/events', apiSeoulCampusEventsController);
router.use('/event/:eventId', apiEventController);
router.use('/campus', apiCampusController);
router.use('/user/:intraLoginId/events', apiUserEventsController);
router.use('/roles', async (req, res) => {
  const path = `/v2/roles`;
  try {
    const data = await get42Api(path);
    if (data) {
      res.json(data);
    }
  } catch (err) {
    console.error(err);
  }
});
router.use('/user/:intraLoginId/roles', async (req, res) => {
  const path = `/v2/users/${req.params.intraLoginId}/roles`;
  try {
    const data = await get42Api(path);
    if (data) {
      res.json(data);
    }
  } catch (err) {
    console.error(err);
  }
});
router.use('/user/:intraLoginId', apiUserController);

module.exports = router;
