const httpStatus = require('http-status');
const jwt = require('jsonwebtoken');
const env = require('../config');
const CONSTANTS = require('../utils/constants');
const {
  getCampusEvents,
  getEvent,
  updateEvent,
  deleteEvent,
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
  const body = req.body;

  const existingUser = await getUser(intraUsername);
  if (
    !(
      existingUser.role === 'admin' ||
      body.source === 'mock' || // TODO: add user role check
      (body.source === 'cadet' && existingUser.role === 'cadet')
    )
  ) {
    return res.status(httpStatus.FORBIDDEN).json({
      message: ' Forbidden',
    });
  }

  if (
    !body.event.title ||
    !body.event.description ||
    !body.event.category ||
    !body.event.beginAt ||
    !body.event.endAt
  ) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: 'Required field is missing',
    });
  }

  // utc+9 to utc-0
  const beginAt = new Date(
    new Date(body.event.beginAt).getTime() - 9 * 60 * 60 * 1000,
  );
  const endAt = new Date(
    new Date(body.event.endAt).getTime() - 9 * 60 * 60 * 1000,
  );
  console.log('beginAt: ', beginAt);
  console.log('endAt: ', endAt);
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
    beginAt,
    endAt,
    category: body.event.category,
    tags: JSON.stringify(tags),
  };
  let source;
  if (body.source === '42api') source = CONSTANTS.EVENT_SOURCE_42API;
  else if (body.source === 'admin') source = CONSTANTS.EVENT_SOURCE_ADMIN;
  else if (body.source === 'cadet') source = CONSTANTS.EVENT_SOURCE_CADET;
  else if (body.source === 'mock') source = CONSTANTS.EVENT_SOURCE_MOCK;
  else source = 0;

  const savedEvent = await saveEventInDb(eventData, source);
  const parse = JSON.parse(savedEvent.dataValues.tags);
  const resTags = parse.map(tag => tag.name);
  return res.status(httpStatus.OK).json({
    ...savedEvent.dataValues,
    tags: resTags,
  });
};

const putEventController = async (req, res) => {
  const decodedToken = jwt.verify(
    req.cookies[env.cookie.auth],
    env.cookie.secret,
  );
  const intraUsername = decodedToken.username;
  const eventId = req.params.eventId;
  const body = req.body;

  const existingUser = await getUser(intraUsername);
  const existingEvent = await getEvent(eventId);
  if (!existingEvent) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: 'Event not found',
    });
  }
  console.log('event: ', existingEvent);

  if (
    !(
      (
        existingUser.role === 'admin' ||
        existingEvent.source === 'mock' || // TODO: add user role check
        (existingEvent.source === 'cadet' && existingUser.role === 'cadet')
      )
      // TODO: add (event.createdBy === intraUsername)
    )
  ) {
    return res.status(httpStatus.FORBIDDEN).json({
      message: 'Forbidden',
    });
  }

  if (
    !body.event.title ||
    !body.event.description ||
    !body.event.category ||
    !body.event.beginAt ||
    !body.event.endAt
  ) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: 'Required field is missing',
    });
  }

  // utc+9 to utc-0
  const beginAt = new Date(
    new Date(body.event.beginAt).getTime() - 9 * 60 * 60 * 1000,
  );
  const endAt = new Date(
    new Date(body.event.endAt).getTime() - 9 * 60 * 60 * 1000,
  );
  const tags = body.event.tags.map(tag => {
    return { name: tag };
  });
  const newEventData = {
    title: body.event.title,
    description: body.event.description,
    location: body.event.location,
    maxSubscribers: body.event.maxSubscribers,
    beginAt,
    endAt,
    category: body.event.category,
    tags: JSON.stringify(tags),
  };

  const updatedEvent = await updateEvent(eventId, newEventData);
  return res.status(httpStatus.OK).json(updatedEvent);
};

const deleteEventController = async (req, res) => {
  const decodedToken = jwt.verify(
    req.cookies[env.cookie.auth],
    env.cookie.secret,
  );
  const intraUsername = decodedToken.username;
  const eventId = req.params.eventId;

  const existingUser = await getUser(intraUsername);
  const existingEvent = await getEvent(eventId);
  if (!existingEvent) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: 'Event not found',
    });
  }

  if (
    !(
      (
        existingUser.role === 'admin' ||
        existingEvent.source === 'mock' || // TODO: add user role check
        (existingEvent.source === 'cadet' && existingUser.role === 'cadet')
      )
      // TODO: add (event.createdBy === intraUsername)
    )
  ) {
    return res.status(httpStatus.FORBIDDEN).json({
      message: 'Forbidden',
    });
  }

  const result = await deleteEvent(eventId);
  if (!result) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to delete event',
    });
  }
  return res.status(httpStatus.OK).json({
    message: 'Event deleted',
  });
};

module.exports = {
  apiSeoulCampusEventsController: async (req, res) => {
    const { range, source, update } = req.query;
    const options = {};
    if (range) {
      options.range = range;
    }
    if (source) {
      options.includeSources = source.split(',');
    }
    if (update)
      options.forceUpdate = update === 'force' ? true : false;
    try {
      const data = await getCampusEvents(options);
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
      if (!data || data.length === 0) {
        res.status(httpStatus.NO_CONTENT).json({
          message: 'my events is empty',
        });
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
      res.json(data);
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

      const status = await getUserEventReminderStatus(intraUsername, eventId);
      if (status === null) {
        res.status(httpStatus.NO_CONTENT).json({
          message: "This event doesn't have a reminder setting.",
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
      const beforeMinutes = new Date(
        event.beginAt - 1000 * 60 * CONSTANTS.REMINDER_BEFORE_EVENT_MINUTES,
      );
      const userEventStatus = await setUserEventReminderOn(
        intraUsername,
        eventId,
        beforeMinutes < now ? now : beforeMinutes,
      );
      console.log('userEventStatus', userEventStatus);
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
