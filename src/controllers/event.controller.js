const httpStatus = require('http-status');
const jwt = require('jsonwebtoken');
const env = require('../config');
const {
  getCampusEvents,
  getEvent,
  getUserEvents,
  getUserEventReminderStatus,
  setUserEventReminderOn,
  setUserEventReminderOff,
} = require('../services/event.service');

module.exports = {
  apiSeoulCampusEventsController: async (req, res) => {
    try {
      const data = await getCampusEvents();
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
      console.log('** after my events');
    } catch (err) {
      console.error(err);
    }
  },
  apiUserEventReminderStatusController: async (req, res) => {
    const decodedToken = jwt.verify(
      req.cookies[env.cookie.auth],
      env.cookie.secret,
    );
    const intraUsername = decodedToken.username;
    const { eventId } = req.params;

    try {
      const event = await getEvent(eventId);
      if (!event) {
        res.status(httpStatus.NOT_FOUND).json({
          message: 'event not found',
        });
      }

      const status = await getUserEventReminderStatus(intraUsername, eventId);
      if (status === null) {
        res.status(httpStatus.NOT_FOUND).json({
          message: 'user event reminder status not found',
        });
      }
      console.log('status: ', status);
      res.json({
        reminder: status,
      });
    } catch (err) {
      console.error(err);
    }
  },
  apiUserEventReminderOnController: async (req, res) => {
    const decodedToken = jwt.verify(
      req.cookies[env.cookie.auth],
      env.cookie.secret,
    );
    const intraUsername = decodedToken.username;
    const { eventId } = req.params;

    try {
      const event = await getEvent(eventId);
      if (!event) {
        res.status(httpStatus.NOT_FOUND).json({
          message: 'event not found',
        });
      }

      const beforeOneHour = new Date(event.beginAt - 1000 * 60 * 60);
      // const beforeFiveMinutes = new Date(event.beginAt - 1000 * 60 * 5);
      setUserEventReminderOn(intraUsername, eventId, beforeOneHour);
      res.json({
        reminder: true,
        remindAt: beforeOneHour,
        event: event,
      });
    } catch (err) {
      console.error(err);
    }
  },
  apiUserEventReminderOffController: async (req, res) => {
    const decodedToken = jwt.verify(
      req.cookies[env.cookie.auth],
      env.cookie.secret,
    );
    const intraUsername = decodedToken.username;
    const { eventId } = req.params;

    try {
      const event = await getEvent(eventId);
      if (!event) {
        res.status(httpStatus.NOT_FOUND).json({
          message: 'event not found',
        });
      }

      setUserEventReminderOff(intraUsername, eventId);
      res.json({
        reminder: false,
        event: event,
      });
    } catch (err) {
      console.error(err);
    }
  },
};
