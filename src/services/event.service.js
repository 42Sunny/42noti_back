const UserEvent = require('../models/userEvent.model');
const {
  normalizeDbEventToResponse,
  getEventsInDb,
  getEventInDb,
  updateEventInDb,
  deleteEventInDb,
  getUserEventsInDb,
  getUserEventInDb,
  // syncUserEventsOnDbAndApi,
} = require('../utils/event');
const { getUserInDb } = require('../utils/user');

module.exports = {
  getCampusEvents: async () => {
    const originalData = await getEventsInDb();
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
      console.log('userEvent: ', userEvent);
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
          userId: user.id,
          eventId: event.id,
        },
      });
      if (!userEvent) {
        return null;
      }
      userEvent.isSetReminder = true;
      userEvent.remindAt = remindAt;
      await userEvent.save();
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
      return userEvent;
    } catch (err) {
      console.error(err);
    }
  },
};
