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

const test = ['42api', 'admin', 'cadet', 'mock'];
// array to numbers
// 42api: 1, admin: 2, cadet: 3, mock: 4
const test2 = test.map(x => {
  if (x === '42api') return CONSTANTS.EVENT_SOURCE_42API;
  if (x === 'admin') return CONSTANTS.EVENT_SOURCE_ADMIN;
  if (x === 'cadet') return CONSTANTS.EVENT_SOURCE_CADET;
  if (x === 'mock') return CONSTANTS.EVENT_SOURCE_MOCK;
});

module.exports = {
  getCampusEvents: async options => {
    const { range, includeSources, forceUpdate } = options;
    let query = null;
    const now = new Date();
    if (range) {
      query = query || {};
      if (range === 'upcoming') query.endAt = { [Op.gte]: now };
      if (range === 'past') query.beginAt = { [Op.lte]: now };
      if (range === 'all') query = {};
    }
    if (includeSources) {
      const sourceArray = includeSources.map(source => {
        if (source === '42api') return CONSTANTS.EVENT_SOURCE_42API;
        if (source === 'admin') return CONSTANTS.EVENT_SOURCE_ADMIN;
        if (source === 'cadet') return CONSTANTS.EVENT_SOURCE_CADET;
        if (source === 'mock') return CONSTANTS.EVENT_SOURCE_MOCK;
      });
      query = query || {};
      query.source = { [Op.in]: sourceArray };
    }
    if (forceUpdate) {
      await syncUpComingEventsOnDbAndApi();
    }
    const originalData = await getEventsInDb(query);
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
