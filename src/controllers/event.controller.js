const httpStatus = require('http-status');
const jwt = require('jsonwebtoken');
const env = require('../config');
const {
  getCampusEvents,
  getEvent,
  getUserEvent,
  getUserEvents,
  getUserEventReminderStatus,
  setUserEventReminderOn,
  setUserEventReminderOff,
} = require('../services/event.service');
const { getUser } = require('../services/user.service');
const { saveUserEventInDb } = require('../utils/event');

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
      const user = await getUser(intraUsername);
      if (!user) {
        res.status(httpStatus.NOT_FOUND).json({
          message: 'user not found',
        });
      }
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
    const range = req.query.range;

    try {
      const data = await getUserEvents(intraUsername);
      if (!data) {
        res.status(httpStatus.NOT_FOUND).json({
          message: 'my events not found',
        });
      }
      if (range == 'all') {
        res.json(data);
      }
      if (range == 'upcoming') {
        const upcomingEvents = data.filter(
          event => event.beginAt >= new Date(),
        );
        res.json(upcomingEvents);
      }
      if (range == 'past') {
        const pastEvents = data.filter(event => event.beginAt < new Date());
        res.json(pastEvents);
      }
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
      if (event.beginAt < new Date()) {
        res.json({
          message: 'event is already started.',
          reminder: null,
        });
      }

      // TODO: remove about intra subscribe state
      const status = await getUserEventReminderStatus(intraUsername, eventId);
      if (status === null) {
        res.status(httpStatus.NOT_FOUND).json({
          message: 'user event not found',
        });
      }
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
      const user = await getUser(intraUsername);
      if (!user) {
        res.status(httpStatus.NOT_FOUND).json({
          message: 'user not found',
        });
      }
      const event = await getEvent(eventId);
      if (!event) {
        res.status(httpStatus.NOT_FOUND).json({
          message: 'event not found',
        });
      }
      const now = new Date();
      if (event.beginAt < now) {
        res.json({
          message: 'event is already started.',
          reminder: null,
        });
      }

      const userEvent = await getUserEvent(intraUsername, eventId);
      if (!userEvent) {
        await saveUserEventInDb(intraUsername, eventId, {
          isSubscribedOnIntra: false,
          isSetReminder: true,
        });
      }

      // TODO: array to save multiple remindAt
      const beforeOneHour = new Date(event.beginAt - 1000 * 60 * 60);
      // const beforeFiveMinutes = new Date(event.beginAt - 1000 * 60 * 5);
      const userEventStatus = await setUserEventReminderOn(
        intraUsername,
        eventId,
        beforeOneHour < now ? now : beforeOneHour,
      );
      res.json({
        reminder: userEventStatus.dataValues.isSetReminder,
        remindAt: userEventStatus.dataValues.remindAt,
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
      const user = await getUser(intraUsername);
      if (!user) {
        res.status(httpStatus.NOT_FOUND).json({
          message: 'user not found',
        });
      }
      const event = await getEvent(eventId);
      if (!event) {
        res.status(httpStatus.NOT_FOUND).json({
          message: 'event not found',
        });
      }
      const now = new Date();
      if (event.beginAt < now) {
        res.json({
          message: 'event is already started.',
          reminder: null,
        });
      }

      const userEvent = await getUserEvent(intraUsername, eventId);
      console.log('userEvent: ', userEvent);
      if (!userEvent) {
        res.status(httpStatus.NOT_FOUND).json({
          message: 'user event not found',
        });
      }

      const userEventStatus = await setUserEventReminderOff(
        intraUsername,
        eventId,
      );
      res.json({
        reminder: userEventStatus.isSetReminder,
        event: event,
      });
    } catch (err) {
      console.error(err);
    }
  },
};
