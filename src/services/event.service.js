const { Op } = require('sequelize');
const {
  normalizeEventToResponse,
  updateUserEventsRemindAt,
  syncUpComingEventsOnDbAndApi,
  // syncUserEventsOnDbAndApi,
} = require('../utils/event');
const { User, Event, UserEvent } = require('../models');
const {
  updateEveryScheduleReminderSlackDm,
  addScheduleReminderSlackDm,
  removeScheduleReminderSlackDm,
} = require('../utils/reminder');
const { sendEveryoneUpdatedEventSlackDm } = require('../utils/reminder');
const CONSTANTS = require('../utils/constants');

module.exports = {
  getCampusEvents: async options => {
    const { range, includeSources, forceUpdate, page, limit } = options;
    const now = new Date();
    const where = {};

    // TODO: move query to model
    if (range === 'upcoming') where.beginAt = { [Op.gt]: now };
    else if (range === 'past') where.beginAt = { [Op.lte]: now };
    else if (range === 'all')
      where.beginAt = { [Op.or]: [{ [Op.lte]: now }, { [Op.gt]: now }] };
    else where.beginAt = { [Op.gte]: now };

    where.source = {
      [Op.in]: includeSources.map(source => {
        if (source === '42api') return CONSTANTS.EVENT_SOURCE_42API;
        if (source === 'admin') return CONSTANTS.EVENT_SOURCE_ADMIN;
        if (source === 'cadet') return CONSTANTS.EVENT_SOURCE_CADET;
        if (source === 'mock') return CONSTANTS.EVENT_SOURCE_MOCK;
      }),
    };

    where.offset = (page - 1) * limit;
    // limit type to number
    where.limit = range === 'upcoming' ? -1 : Number(limit);

    if (forceUpdate) await syncUpComingEventsOnDbAndApi();
    const originalData = await Event.getEvents(where);
    if (!originalData) {
      return null;
    }
    const data = await originalData.map(event =>
      normalizeEventToResponse(event),
    );
    return data;
  },
  getEvent: async eventId => {
    const originalData = await Event.getEvent(eventId);
    if (!originalData) {
      return null;
    }
    const data = normalizeEventToResponse(originalData);
    return data;
  },
  updateEvent: async (eventId, data) => {
    const existingEvent = await Event.getEvent(eventId);
    if (!existingEvent) {
      return null;
    }
    const event = await Event.updateEvent(data, eventId);

    const remindAt = new Date(
      new Date(event.beginAt).getTime() -
        1000 * 60 * CONSTANTS.REMINDER_BEFORE_EVENT_MINUTES,
    );
    await updateUserEventsRemindAt(event.id, remindAt);
    await sendEveryoneUpdatedEventSlackDm(event.id);
    await updateEveryScheduleReminderSlackDm(event.id);
    return normalizeEventToResponse(event);
  },
  deleteEvent: async eventId => {
    const originalData = await Event.deleteEvent(eventId);
    if (!originalData) {
      return null;
    }
    return true;
  },
  getUserEvents: async intraUsername => {
    // await syncUserEventsOnDbAndApi(intraUsername); // TODO: do this only force update.
    const user = await User.getUser(intraUsername);
    const userEvents = await UserEvent.getUserEventsByUserId(user.id);
    if (!userEvents) {
      return null;
    }
    return Promise.all(
      userEvents.map(async userEvent => {
        const event = await Event.getEvent(userEvent.EventId);
        return normalizeEventToResponse(event);
      }),
    );
  },
  getUserEvent: async (intraUsername, eventId) => {
    const user = await User.getUser(intraUsername);
    const userEvent = await UserEvent.getUserEvent(user.id, eventId);
    if (!userEvent) {
      return null;
    }
    const event = await Event.getEvent(userEvent.EventId);
    return normalizeEventToResponse(event);
  },
  getUserEventReminderStatus: async (intraUsername, eventId) => {
    try {
      const user = await User.getUser(intraUsername);

      const userEvent = await UserEvent.findOne({
        where: {
          userId: user.id,
          eventId: eventId,
        },
        raw: true,
      });
      if (!userEvent) {
        return null;
      }
      return userEvent.isSetReminder ? true : false;
    } catch (err) {
      console.error(err);
    }
  },
  setUserEventReminderOn: async (intraUsername, eventId, remindAt) => {
    try {
      const user = await User.getUser(intraUsername);

      const userEvent = await UserEvent.findOne({
        where: {
          UserId: user.id,
          EventId: eventId,
        },
      });
      if (!userEvent) {
        return null;
      }
      userEvent.isSetReminder = true;
      userEvent.remindAt = remindAt;
      await userEvent.save();
      await addScheduleReminderSlackDm(eventId, intraUsername);
      return userEvent;
    } catch (err) {
      console.error(err);
    }
  },
  setUserEventReminderOff: async (intraUsername, eventId) => {
    try {
      const user = await User.getUser(intraUsername);

      const userEvent = await UserEvent.findOne({
        where: {
          userId: user.id,
          eventId: eventId,
        },
      });
      if (!userEvent) {
        return null;
      }
      userEvent.isSetReminder = false;
      userEvent.remindAt = null;
      await userEvent.save();
      await removeScheduleReminderSlackDm(eventId, intraUsername);
      return userEvent;
    } catch (err) {
      console.error(err);
    }
  },
};
