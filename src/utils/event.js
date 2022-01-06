const { Op } = require('sequelize');
const Event = require('../models/event.model');
const User = require('../models/user.model');
const UserEvent = require('../models/userEvent.model');
const {
  get42CampusUpComingEvents,
  get42CampusRecentThirtyEvents,
  get42RecentUserEvents,
} = require('./42api');
const { getUserInDb } = require('./user');

const normalizeApiEventToSaveInDb = originalEvent => {
  return {
    intraId: originalEvent.id,
    title: originalEvent.name,
    description: originalEvent.description,
    location: originalEvent.location,
    category: originalEvent.kind,
    maxSubscribers: originalEvent.max_people,
    currentSubscribers: originalEvent.nbr_subscribers,
    beginAt: originalEvent.begin_at,
    endAt: originalEvent.end_at,
    tags: JSON.stringify(originalEvent.themes),
    intraCreatedAt: originalEvent.created_at,
    intraUpdatedAt: originalEvent.updated_at,
  };
};

const normalizeDbEventToResponse = dbEvent => {
  const parse = JSON.parse(dbEvent.tags);
  const tags = parse.map(tag => tag.name);
  return {
    id: dbEvent.intraId, // NOTE: or dbEvent.id ?
    title: dbEvent.title,
    description: dbEvent.description,
    location: dbEvent.location,
    category: dbEvent.category, // NOTE: deprecated
    maxSubscribers: dbEvent.maxSubscribers,
    currentSubscribers: dbEvent.currentSubscribers,
    beginAt: dbEvent.beginAt,
    endAt: dbEvent.endAt,
    tags,
    createdAt: dbEvent.intraCreatedAt,
    updatedAt: dbEvent.intraUpdatedAt,
  };
};

const getEventsInDb = async query => {
  if (!query) {
    const now = new Date();
    const events = await Event.findAll({
      where: {
        endAt: { [Op.gte]: now },
      },
      order: [['beginAt', 'DESC']],
      raw: true,
    });
    return events;
  }
  const events = await Event.findAll({
    where: query,
    order: [['beginAt', 'DESC']],
    raw: true,
  });
  return events;
};

const getEventInDb = async eventId => {
  try {
    const event = await Event.findOne({
      where: { intraId: eventId },
      raw: true,
    });
    if (!event) {
      return null;
    }
    return event;
  } catch (err) {
    console.error(err);
  }
};

const getUserEventsInDb = async userId => {
  try {
    const user = await User.findOne({
      where: { intraUsername: userId },
    });
    const userEvents = await user.getEvent({
      order: [['beginAt', 'DESC']],
      raw: true,
    });
    return userEvents;
  } catch (err) {
    console.error(err);
  }
};

const saveEventInDb = async event => {
  try {
    const foundEvent = await Event.findOne({
      where: { intraId: event.intraId },
      raw: true,
    });
    if (foundEvent) {
      return foundEvent;
    }
    const newEvent = await Event.create(event);
    return newEvent;
  } catch (err) {
    console.error(err);
  }
};

const saveUserEventInDb = async (user, event) => {
  try {
    const foundUserEvent = await UserEvent.findOne({
      where: { UserId: user.id, EventId: event.id },
      raw: true,
    });
    if (foundUserEvent) {
      return foundUserEvent;
    }
    const now = new Date();
    const beforeOneHourThenBeginAt = new Date(
      event.beginAt.getTime() - 1000 * 60 * 60,
    );
    const remindAt =
      beforeOneHourThenBeginAt > now ? beforeOneHourThenBeginAt : null;
    const newUserEvent = await UserEvent.create({
      UserId: user.id,
      EventId: event.id,
      remindAt,
    });
    return newUserEvent;
  } catch (err) {
    console.error(err);
  }
};

const deleteUserEventInDb = async eventId => {
  try {
    const foundUserEvent = await UserEvent.findOne({
      where: { EventId: eventId },
      raw: true,
    });
    if (!foundUserEvent) {
      return null;
    }
    const deletedUserEvent = await foundUserEvent.destroy();
    return deletedUserEvent;
  } catch (err) {
    console.error(err);
  }
};

const updateEventInDb = async event => {
  try {
    const foundEvent = await Event.findOne({
      where: { intraId: event.intraId },
      // raw: true,
    });
    if (!foundEvent) {
      return null;
    }
    const updatedEvent = await foundEvent.update(event);
    const foundUserEvent = await UserEvent.findAll({
      where: { EventId: foundEvent.id },
      raw: true,
    });
    console.log('updateEventInDb');
    console.log(event.beginAt, typeof event.beginAt);
    if (foundUserEvent) {
      const now = new Date();
      const beforeOneHourThenBeginAt = new Date(
        new Date(event.beginAt).getTime() - 1000 * 60 * 60,
      );
      const remindAt =
        beforeOneHourThenBeginAt > now ? beforeOneHourThenBeginAt : null;
      foundUserEvent.forEach(async userEvent => {
        await userEvent.update({ remindAt });
      });
    }
    return updatedEvent;
  } catch (err) {
    console.error(err);
  }
};

const SEOUL_CAMPUS_ID = '29';

const syncUpComingEventsOnDbAndApi = async () => {
  console.log('syncUpComingEventsOnDbAndApi');
  try {
    const eventsFrom42Api = await get42CampusUpComingEvents(SEOUL_CAMPUS_ID);
    if (!eventsFrom42Api) throw new Error('campus events not found');
    eventsFrom42Api.forEach(async eventFromApi => {
      const eventInDb = await getEventInDb(eventFromApi.id);
      if (!eventInDb) {
        // save new event in db
        const newEvent = await saveEventInDb(
          normalizeApiEventToSaveInDb(eventFromApi),
        );
        console.log(
          `🆕 new event created: ${newEvent.intraId} ${newEvent.title}`,
        );
      } else {
        if (eventFromApi.updated_at !== eventInDb.intraUpdatedAt) {
          // update event in db
          const updatedEvent = await updateEventInDb(
            normalizeApiEventToSaveInDb(eventFromApi),
          );
          console.log(
            `🆙 event updated: ${updatedEvent.intraId} ${updatedEvent.title}`,
          );
        }
      }
    });
  } catch (err) {
    console.error(err);
  }
};

const syncRecentThirtyEventsOnDbAndApi = async () => {
  try {
    const eventsFrom42Api = await get42CampusRecentThirtyEvents(
      SEOUL_CAMPUS_ID,
    );
    if (!eventsFrom42Api) throw new Error('campus events not found');
    eventsFrom42Api.forEach(async eventFromApi => {
      const eventInDb = await getEventInDb(eventFromApi.id);
      if (!eventInDb) {
        // save new event in db
        const newEvent = await saveEventInDb(
          normalizeApiEventToSaveInDb(eventFromApi),
        );
        console.log(
          `🆕 new event created: ${newEvent.intraId} ${newEvent.title}`,
        );
      } else {
        if (eventFromApi.updated_at !== eventInDb.intraUpdatedAt) {
          // update event in db
          const updatedEvent = await updateEventInDb(
            normalizeApiEventToSaveInDb(eventFromApi),
          );
          console.log(
            `🆙 event updated: ${updatedEvent.intraId} ${updatedEvent.title}`,
          );
        }
      }
    });
  } catch (err) {
    console.error(err);
  }
};

const syncUserEventsOnDbAndApi = async intraUsername => {
  try {
    console.log('syncUserEventsOnDbAndApi');
    const user = await getUserInDb(intraUsername);
    const userEventsDb = await getUserEventsInDb(intraUsername);
    const recentestUserEventIdInDb = userEventsDb.reduce((prev, current) => {
      return prev.intraId > current.intraId ? prev.intraId : current.intraId;
    }, 0);

    const recentUserEventsApi = await get42RecentUserEvents(
      intraUsername,
      recentestUserEventIdInDb + 1,
    );
    if (!recentUserEventsApi) throw new Error('user events not found');

    // update new subscribed event from api to db
    recentUserEventsApi.forEach(async userEventFromApi => {
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
          `🆕 new user event created: ` +
            `${newUserEvent.intraId} ${newUserEvent.title}`,
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
          console.log('🆕 new user event created: ', newUserEvent.title);
        }
      }
    });

    const userEventsApi = await get42UserEvents(intraUsername);

    // remove cancel subscribe event from api to db
    userEventsDb.forEach(async userEventFromDb => {
      console.log('+ ', userEventFromDb.intraId);
      const exist = userEventsApi.find(
        userEventFromApi => userEventFromApi.id === userEventFromDb.intraId,
      );
      console.log('exist: ', exist);
      if (exist) return;
      await deleteUserEventInDb(userEventFromDb.id);
      console.log(
        `🗑 user event deleted: ` +
          `${userEventFromDb.intraId} ${userEventFromDb.title}`,
      );
    });
  } catch (err) {
    console.error(err);
  }
};

module.exports = {
  normalizeApiEventToSaveInDb,
  normalizeDbEventToResponse,
  getEventsInDb,
  getEventInDb,
  getUserEventsInDb,
  syncUpComingEventsOnDbAndApi,
  syncRecentThirtyEventsOnDbAndApi,
  syncUserEventsOnDbAndApi,
};
