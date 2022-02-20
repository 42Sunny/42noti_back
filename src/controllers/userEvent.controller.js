const httpStatus = require('http-status');
const CONSTANTS = require('../utils/constants');
const { getEvent } = require('../services/event.service');
const {
  getUserEvent,
  getUserEvents,
  getUserEventReminderStatus,
  setUserEventReminderOn,
  setUserEventReminderOff,
} = require('../services/userEvent.service');
const { getUser } = require('../services/user.service');
const { UserEvent } = require('../models');
const logger = require('../utils/winston');

const userEventsController = async (req, res) => {
  const { intraUsername } = req.params;

  try {
    const user = await getUser(intraUsername);
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: 'user not found',
      });
    }
    const data = await getUserEvents(intraUsername);
    if (!data) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: 'user events not found',
      });
    }
    return res.json(data);
  } catch (err) {
    logger.error(err);
  }
};

const myEventsController = async (req, res) => {
  const intraUsername = req.user.jwt.name;
  const range = req.query.range;

  try {
    const data = await getUserEvents(intraUsername);
    console.log('data', data)
    if (!data || data.length === 0) {
      return res.status(httpStatus.OK).json([]);
    }
    if (range == 'upcoming') {
      const upcomingEvents = data.filter(
        event => event.beginAt >= new Date(),
      );
      return res.json(upcomingEvents);
    }
    if (range == 'past') {
      const pastEvents = data.filter(event => event.beginAt < new Date());
      return res.json(pastEvents);
    }
    return res.json(data);
  } catch (err) {
    logger.error(err);
  }
};
const userEventReminderStatusController = async (req, res) => {
  const intraUsername = req.user.jwt.name;
  const { eventId } = req.params;

  try {
    const event = await getEvent(eventId);
    if (!event) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: 'event not found',
      });
    }

    const status = await getUserEventReminderStatus(intraUsername, eventId);
    if (status === null) {
      return res.status(httpStatus.OK).json({
        message: "This event doesn't have a reminder setting.",
        reminder: null,
      });
    }
    return res.status(httpStatus.OK).json({
      reminder: status,
    });
  } catch (err) {
    logger.error(err);
  }
};

const userEventReminderOnController = async (req, res) => {
  const intraUsername = req.user.jwt.name;
  const { eventId } = req.params;

  try {
    const user = await getUser(intraUsername);
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: 'user not found',
      });
    }
    const event = await getEvent(eventId);
    if (!event) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: 'event not found',
      });
    }
    const now = new Date();
    if (event.beginAt < now) {
      return res.status(httpStatus.OK).json({
        message: 'event is already started.',
        reminder: null,
      });
    }
    const beforeMinutesThenBeginAt = new Date(
      event.beginAt.getTime() - 1000 * 60 * CONSTANTS.REMINDER_BEFORE_MINUTES,
    );

    const userEvent = await getUserEvent(intraUsername, eventId);
    if (!userEvent) {
      await UserEvent.saveUserEvent(user.id, eventId, {
        isSubscribedOnIntra: false,
        isSetReminder: true,
        remindAt: beforeMinutesThenBeginAt,
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
    return res.status(httpStatus.CREATED).json({
      reminder: userEventStatus.dataValues.isSetReminder,
      remindAt: userEventStatus.dataValues.remindAt,
      event: event,
    });
  } catch (err) {
    logger.error(err);
  }
};

const userEventReminderOffController = async (req, res) => {
  const intraUsername = req.user.jwt.name;
  const { eventId } = req.params;

  try {
    const user = await getUser(intraUsername);
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: 'user not found',
      });
    }
    const event = await getEvent(eventId);
    if (!event) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: 'event not found',
      });
    }
    const now = new Date();
    if (event.beginAt < now) {
      return res.status(httpStatus.OK).json({
        message: 'event is already started.',
        reminder: null,
      });
    }

    const userEvent = await getUserEvent(intraUsername, eventId);
    if (!userEvent) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: 'user event not found',
      });
    }

    const userEventStatus = await setUserEventReminderOff(
      intraUsername,
      eventId,
    );
    return res.status(httpStatus.OK).json({
      reminder: userEventStatus.isSetReminder,
      event: event,
    });
  } catch (err) {
    logger.error(err);
  }
};

module.exports = {
  userEventsController,
  myEventsController,
  userEventReminderStatusController,
  userEventReminderOnController,
  userEventReminderOffController,
};
