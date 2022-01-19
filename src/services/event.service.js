const { Op } = require('sequelize');
const UserEvent = require('../models/userEvent.model');
const {
  normalizeDbEventToResponse,
  getEventsInDb,
  getEventInDb,
  updateEventInDb,
  deleteEventInDb,
  getUserEventsInDb,
  getUserEventInDb,
  syncUpComingEventsOnDbAndApi,
  // syncUserEventsOnDbAndApi,
} = require('../utils/event');
const { getUserInDb } = require('../utils/user');
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
    const originalData = await getEventsInDb(where);
    if (!originalData) {
      return null;
    }
    const data = await originalData.map(event =>
      normalizeDbEventToResponse(event),
    );
    return data;
  },
  getEvent: async eventId => {
    const originalData = await getEventInDb(eventId);
    if (!originalData) {
      return null;
    }
    const data = normalizeDbEventToResponse(originalData);
    return data;
  },
  updateEvent: async (eventId, newEvent) => {
    const originalData = await getEventInDb(eventId);
    if (!originalData) {
      return null;
    }
    const data = await updateEventInDb(newEvent, eventId);
    // TODO: send slack DM to all users
    await sendEveryoneUpdatedEventSlackDm(eventId);
    await updateEveryScheduleReminderSlackDm(eventId);
    return normalizeDbEventToResponse(data);
  },
  deleteEvent: async eventId => {
    const originalData = await deleteEventInDb(eventId);
    if (!originalData) {
      return null;
    }
    return true;
  },
  getUserEvents: async intraUsername => {
    // await syncUserEventsOnDbAndApi(intraUsername); // TODO: do this only force update.
    const originalData = await getUserEventsInDb(intraUsername);
    if (!originalData) {
      return null;
    }
    const data = originalData.map(event => normalizeDbEventToResponse(event));
    return data;
  },
  getUserEvent: async (intraUsername, eventId) => {
    const originalData = await getUserEventInDb(intraUsername, eventId);
    if (!originalData) {
      return null;
    }
    const data = normalizeDbEventToResponse(originalData);
    return data;
  },
  getUserEventReminderStatus: async (intraUsername, eventId) => {
    try {
      const user = await getUserInDb(intraUsername);
      const event = await getEventInDb(eventId);

      const userEvent = await UserEvent.findOne({
        where: {
          userId: user.id,
          eventId: event.id,
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
      const user = await getUserInDb(intraUsername);
      const event = await getEventInDb(eventId);

      const userEvent = await UserEvent.findOne({
        where: {
          UserId: user.id,
          EventId: event.id,
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
      const user = await getUserInDb(intraUsername);
      const event = await getEventInDb(eventId);

      const userEvent = await UserEvent.findOne({
        where: {
          userId: user.id,
          eventId: event.id,
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
