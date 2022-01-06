const UserEvent = require('../models/userEvent.model');
const { get42UserEvents } = require('../utils/42api');
const {
  normalizeApiEventToSaveInDb,
  normalizeDbEventToResponse,
  getEventsInDb,
  getEventInDb,
  getUserEventsInDb,
  syncUserEventsOnDbAndApi,
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
  getUserEvents: async intraUsername => {
    const user = await getUserInDb(intraUsername);
    if (!user) {
      // Cadet who is never logged in.
      const originalData = await get42UserEvents(intraUsername);
      if (!originalData) {
        return null;
      }
      const data = originalData.map(event =>
        normalizeDbEventToResponse(normalizeApiEventToSaveInDb(event)),
      );
      return data;
    }
    await syncUserEventsOnDbAndApi(intraUsername);
    const originalData = await getUserEventsInDb(intraUsername);
    if (!originalData) {
      return null;
    }
    const data = originalData.map(event => normalizeDbEventToResponse(event));
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
      return userEvent.setReminder ? true : false;
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
      userEvent.setReminder = true;
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
      userEvent.setReminder = false;
      userEvent.remindAt = null;
      await userEvent.save();
      return userEvent;
    } catch (err) {
      console.error(err);
    }
  },
};
