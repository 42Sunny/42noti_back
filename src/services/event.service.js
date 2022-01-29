const { Op } = require('sequelize');
const {
  normalizeEventToResponse,
  updateUserEventsRemindAt,
  syncUpComingEventsFrom42,
} = require('../utils/event');
const { Event } = require('../models');
const { updateEveryScheduleReminderSlackDm } = require('../utils/reminder');
const { sendEveryoneUpdatedEventSlackDm } = require('../utils/reminder');
const CONSTANTS = require('../utils/constants');

const getCampusEvents = async options => {
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

  if (forceUpdate) await syncUpComingEventsFrom42();
  const originalData = await Event.getEvents(where);
  if (!originalData) {
    return null;
  }
  const data = await originalData.map(event =>
    normalizeEventToResponse(event),
  );
  return data;
};

const getEvent = async eventId => {
  const originalData = await Event.getEvent(eventId);
  if (!originalData) {
    return null;
  }
  const data = normalizeEventToResponse(originalData);
  return data;
};

const updateEvent = async (eventId, data) => {
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
};

const deleteEvent = async eventId => {
  const originalData = await Event.deleteEvent(eventId);
  if (!originalData) {
    return null;
  }
  return true;
};

module.exports = {
  getCampusEvents,
  getEvent,
  updateEvent,
  deleteEvent
};
