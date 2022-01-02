const Event = require('../models/event.model');
const UserEvent = require('../models/userEvent.model');
const {
  get42CampusEvents,
  get42UserEvents,
  get42CampusNewestEvents,
} = require('../utils/42api');
const {
  normalizeApiEventToSaveInDb,
  normalizeDbEventToResponse,
  getEventsInDb,
  getEventInDb,
  getUserEventsInDb,
  saveEventInDb,
  saveUserEventInDb,
  updateEventInDb,
} = require('../utils/event');
const {
  getUserInDb,
} = require('../utils/user');

const isNewEventCreated = async () => {
  try {
    const newestEvent = await get42CampusNewestEvents(SEOUL_CAMPUS_ID);
    if (!newestEvent) throw new Error('campus events not found');
    const newestEventId = newestEvent[0].id;
    const lastEventId = await Event.findOne({}).sort({ id: -1 });
    if (!lastEventId) return true;
    if (newestEventId === lastEventId?.intraId) return false;
    return true;
  } catch (err) {
    console.error(err);
  }
};

const isEventUpdated = async (events, eventInDb) => {
  try {
    const eventFromApi = await events.find(e => e.id === eventInDb.intraId);
    if (eventInDb.intraUpdatedAt === eventFromApi.updated_at) {
      return false;
    }
    return true;
  } catch (err) {
    console.error(err);
  }
};

const SEOUL_CAMPUS_ID = '29';

const syncEventsOnDbAndApi = async () => {
  try {
    const eventsFromApi = await get42CampusEvents(SEOUL_CAMPUS_ID);
    if (!eventsFromApi) throw new Error('campus events not found');
    return Promise.all(
      eventsFromApi.map(async eventFromApi => {
        const eventInDb = await getEventInDb(eventFromApi.id);
        if (!eventInDb) {
          const newEvent = await saveEventInDb(
            normalizeApiEventToSaveInDb(eventFromApi),
          );
          console.log(
            `🆕 new event created: ${newEvent.intraId} ${newEvent.title}`,
          );
        } else {
          const needToUpdate = await isEventUpdated(eventsFromApi, eventInDb);
          if (needToUpdate) {
            const updatedEvent = await updateEventInDb(
              normalizeApiEventToSaveInDb(eventFromApi),
            );
            console.log(
              `🆙 event updated: ${updatedEvent.intraId} ${updatedEvent.title}`,
            );
          }
        }
      }),
    );
  } catch (err) {
    console.error(err);
  }
};

const syncUserEventsOnDbAndApi = async intraUsername => {
  try {
    const user = await getUserInDb(intraUsername);
    const userEventsFromApi = await get42UserEvents(intraUsername);
    if (!userEventsFromApi) throw new Error('user events not found');
    return Promise.all(
      userEventsFromApi.map(async userEventFromApi => {
        const eventInDb = await getEventInDb(userEventFromApi.id);
        if (!eventInDb) {
          const newEvent = await saveEventInDb(
            normalizeApiEventToSaveInDb(userEventFromApi),
          );
          console.log(
            `🆕 new event created: ${newEvent.intraId} ${newEvent.title}`,
          );
          const newUserEvent = await saveUserEventInDb(user, newEvent);
          console.log(
            `🆕 new user event created: ${newUserEvent.intraId} ${newUserEvent.title}`,
          );
        } else {
          const userEventInDb = await UserEvent.findOne({
            where: {
              userId: user.id,
              eventId: eventInDb.id,
            },
          });
          if (!userEventInDb) {
            const newUserEvent = await saveUserEventInDb(user, eventInDb);
            console.log('new user event created: ', newUserEvent.title);
          }
        }
      }),
    );
  } catch (err) {
    console.error(err);
  }
};

module.exports = {
  getCampusEvents: async () => {
    await syncEventsOnDbAndApi();
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
};
