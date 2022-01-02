const httpStatus = require('http-status');
const jwt = require('jsonwebtoken');
const env = require('../config');
const {
  getCampusEvents,
  getEvent,
  getUserEvents,
} = require('../services/event.service');

module.exports = {
  apiSeoulCampusEventsController: async (req, res) => {
    try {
      const data = await getCampusEvents();
      console.log('apiSeoulCampusEventsController');
      console.log('data: ', data);
      if (!data) {
        res.status(httpStatus.NOT_FOUND).json({
          message: 'campus events not found',
        });
      }
      res.json(data);
    } catch (err) {
      console.error(err);
    }
  },
  apiEventController: async (req, res) => {
    const { eventId } = req.params;
    try {
      const data = await getEvent(eventId);
      if (!data) {
        res.status(httpStatus.NOT_FOUND).json({
          message: 'event not found',
        });
      }
      res.json(data);
    } catch (err) {
      console.error(err);
    }
  },
  apiUserEventsController: async (req, res) => {
    const { intraUsername } = req.params;
    try {
      const data = await getUserEvents(intraUsername);
      if (!data) {
        res.status(httpStatus.NOT_FOUND).json({
          message: 'user events not found',
        });
      }
      res.json(data);
    } catch (err) {
      console.error(err);
    }
  },
  apiMyEventsController: async (req, res) => {
    const decodedToken = jwt.verify(
      req.cookies[env.cookie.auth],
      env.cookie.secret,
    );
    const intraUsername = decodedToken.username;

    try {
      const data = await getUserEvents(intraUsername);
      if (!data) {
        res.status(httpStatus.NOT_FOUND).json({
          message: 'my events not found',
        });
      }
      res.json(data);
    } catch (err) {
      console.error(err);
    }
  },
};
