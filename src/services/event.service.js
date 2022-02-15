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
      return CONSTANTS.EVENT_SOURCE[source];
    }),
  };

  where.offset = (page - 1) * limit;
  // limit type to number
  where.limit = range === 'upcoming' ? -1 : Number(limit);

  if (forceUpdate) await syncUpComingEventsFrom42();
  const events = await Event.getEvents(where);
  if (events.count === 0) {
    return {
      count: events.count,
      data: events.data,
    };
  }
  const data = await events.data.map(event =>
    normalizeEventToResponse(event),
  );
  return {
    count: events.count,
    data
  };
};

const getEvent = async eventId => {
  const event = await Event.getEvent(eventId);
  if (!event) {
    return null;
  }
  const data = normalizeEventToResponse(event);
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
  const event = await Event.deleteEvent(eventId);
  if (!event) {
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
