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
const { saveEventInDb, saveUserEventInDb } = require('../utils/event');

const postEventController = async (req, res) => {
  const decodedToken = jwt.verify(
    req.cookies[env.cookie.auth],
    env.cookie.secret,
  );
  const intraUsername = decodedToken.username;

  const user = await getUser(intraUsername);
  console.log(`user: ${user.intraUsername}(${user.role})`);

  const body = req.body;
  if (body.source !== 'mock') {
    return res.status(httpStatus.BAD_REQUEST).send('Bad Request');
  }

  const tags = body.event.tags.map(tag => {
    return { name: tag };
  });
  const eventData = {
    intraId: null,
    intraCreatedAt: null,
    intraUpdatedAt: null,
    title: body.event.title,
    description: body.event.description,
    location: body.event.location,
    maxSubscribers: body.event.maxSubscribers,
    currentSubscribers: 0,
    beginAt: body.event.beginAt,
    endAt: body.event.endAt,
    category: body.event.category,
    tags: JSON.stringify(tags),
  };
  let source;
  if (body.source === '42api') source = 1;
  else if (body.source === 'admin') source = 2;
  else if (body.source === 'cadet') source = 3;
  else if (body.source === 'mock') source = 4;
  else source = 0;

  const event = await saveEventInDb(eventData, source);
  const parse = JSON.parse(event.dataValues.tags);
  const resTags = parse.map(tag => tag.name);
  return res.status(httpStatus.OK).send({
    ...event.dataValues,
    tags: resTags
  });
};
const putEventController = async (req, res) => {};
const deleteEventController = async (req, res) => {};

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
  postEventController,
  putEventController,
  deleteEventController,
};
