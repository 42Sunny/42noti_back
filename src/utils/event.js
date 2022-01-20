const { Op } = require('sequelize');
const Event = require('../models/event.model');
const User = require('../models/user.model');
const UserEvent = require('../models/userEvent.model');
const {
  get42CampusUpComingEvents,
  get42CampusRecentThirtyEvents,
  get42CampusEveryEvents,
  get42RecentUserEvents,
} = require('./42api');
const { getUserInDb } = require('./user');
const CONSTANTS = require('./constants');

const normalizeApiEventToSaveInDb = (originalEvent, source) => {
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
    source,
  };
};

const normalizeDbEventToResponse = dbEvent => {
  const parse = JSON.parse(dbEvent.tags);
  const tags = parse.map(tag => tag.name);
  const createdAt = dbEvent.intraCreatedAt
    ? dbEvent.intraCreatedAt
    : dbEvent.createdAt;
  const updatedAt = dbEvent.intraUpdatedAt
    ? dbEvent.intraUpdatedAt
    : dbEvent.updatedAt;
  let source;
  if (dbEvent.source === CONSTANTS.EVENT_SOURCE_42API) source = '42api';
  else if (dbEvent.source === CONSTANTS.EVENT_SOURCE_ADMIN) source = 'admin';
  else if (dbEvent.source === CONSTANTS.EVENT_SOURCE_CADET) source = 'cadet';
  else if (dbEvent.source === CONSTANTS.EVENT_SOURCE_MOCK) source = 'mock';

  return {
    id: dbEvent.id,
    intraId: dbEvent.intraId,
    title: dbEvent.title,
    description: dbEvent.description,
    location: dbEvent.location,
    category: dbEvent.category, // NOTE: deprecated
    maxSubscribers: dbEvent.maxSubscribers,
    currentSubscribers: dbEvent.currentSubscribers,
    beginAt: dbEvent.beginAt,
    endAt: dbEvent.endAt,
    tags,
    createdAt,
    updatedAt,
    source
  };
};

const getEventsInDb = async where => {
  const { beginAt, source, offset, limit } = where;
  console.log('offset, limit', offset, limit);
  const events = await Event.findAll({
    where: { source, beginAt },
    order: [['beginAt', 'DESC']],
    offset,
    limit: limit === -1 ? null : limit,
    raw: true,
  });
  return events;
};

const getEventInDb = async eventId => {
  try {
    const event = await Event.findOne({
      where: { id: eventId },
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

const deleteEventInDb = async eventId => {
  try {
    const existingEvent = await Event.findOne({
      where: { id: eventId },
    });
    if (!existingEvent) {
      return null;
    }
    const deletedEvent = await existingEvent.destroy();
    return deletedEvent;
  } catch (err) {
    console.error(err);
  }
};

const getUserEventsInDb = async intraUsername => {
  try {
    const user = await User.findOne({
      where: { intraUsername: intraUsername },
      include: [
        {
          model: Event,
          as: 'Event',
          through: {
            where: {
              isSetReminder: true,
            },
            attributes: ['isSubscribedOnIntra', 'isSetReminder', 'remindAt'],
          },
        },
      ],
      order: [[Event, 'beginAt', 'DESC']],
    });
    const userEvents = user.Event;
    return userEvents;
  } catch (err) {
    console.error(err);
  }
};

const getUserEventInDb = async (intraUsername, eventId) => {
  try {
    const user = await User.findOne({
      where: { intraUsername: intraUsername },
    });
    const event = await Event.findOne({
      where: { id: eventId },
    });
    const userEvent = await UserEvent.findOne({
      where: { UserId: user.id, EventId: eventId },
      raw: true,
    });
    if (!userEvent) {
      return null;
    }
    return event;
  } catch (err) {
    console.error(err);
  }
};

const saveEventInDb = async (event, source) => {
  try {
    if (source === CONSTANTS.EVENT_SOURCE_42API) {
      const where = event.id ? { id: event.id } : { intraId: event.intraId };
      const existingEvent = await Event.findOne({
        where,
        raw: true,
      });
      if (existingEvent) {
        return existingEvent;
      }
    }
    const newEvent = await Event.create({
      ...event,
      source,
    });
    console.log(newEvent);
    return newEvent;
  } catch (err) {
    console.error(err);
  }
};

const saveUserEventInDb = async (intraUsername, eventId, settings) => {
  const { isSubscribedOnIntra, isSetReminder } = settings;

  try {
    const user = await User.findOne({
      where: { intraUsername: intraUsername },
    });
    const event = await Event.findOne({
      where: { id: eventId },
    });
    const existingUserEvent = await UserEvent.findOne({
      where: { UserId: user.id, EventId: eventId },
      raw: true,
    });
    if (existingUserEvent) {
      return existingUserEvent;
    }
    const now = new Date();
    const beforeMinutesThenBeginAt = new Date(
      event.beginAt.getTime() - 1000 * 60 * CONSTANTS.REMINDER_BEFORE_MINUTES,
    );
    const remindAt =
      beforeMinutesThenBeginAt > now ? beforeMinutesThenBeginAt : null;
    const newUserEvent = await UserEvent.create({
      UserId: user.id,
      EventId: event.id,
      isSubscribedOnIntra,
      isSetReminder,
      remindAt,
    });
    return newUserEvent;
  } catch (err) {
    console.error(err);
  }
};

const deleteUserEventInDb = async eventId => {
  try {
    const existingUserEvent = await UserEvent.findOne({
      where: { id: eventId },
      raw: true,
    });
    if (!existingUserEvent) {
      return null;
    }
    const deletedUserEvent = await existingUserEvent.destroy();
    return deletedUserEvent;
  } catch (err) {
    console.error(err);
  }
};

const updateEventInDb = async (newEvent, eventId = null) => {
  try {
    let where;
    if (eventId) where = { id: eventId };
    else if (newEvent.id) where = { id: newEvent.id };
    else where = { intraId: newEvent.intraId };

    const existingEvent = await Event.findOne({
      where,
    });
    if (!existingEvent) {
      return null;
    }
    const updatedEvent = await existingEvent.update(newEvent);
    const existingUserEvent = await UserEvent.findAll({
      where: { EventId: existingEvent.id },
    });
    if (existingUserEvent) {
      const now = new Date();
      const beforeMinutesThenBeginAt = new Date(
        new Date(newEvent.beginAt).getTime() -
          1000 * 60 * CONSTANTS.REMINDER_BEFORE_MINUTES,
      );
      const remindAt =
        beforeMinutesThenBeginAt > now ? beforeMinutesThenBeginAt : null;
      existingUserEvent.forEach(async userEvent => {
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
    eventsFrom42Api.forEach(async event42 => {
      const existingEvent = await Event.findOne({
        where: { intraId: event42.id },
        raw: true,
      });
      if (!existingEvent) {
        // save new event in db
        const newEvent = await saveEventInDb(
          normalizeApiEventToSaveInDb(event42, CONSTANTS.EVENT_SOURCE_42API),
          CONSTANTS.EVENT_SOURCE_42API,
        );
        console.log(
          `🆕 new event created: ${newEvent.intraId} ${newEvent.title}`,
        );
      } else {
        if (event42.updated_at !== existingEvent.intraUpdatedAt) {
          // update event in db
          const updatedEvent = await updateEventInDb(
            normalizeApiEventToSaveInDb(event42, CONSTANTS.EVENT_SOURCE_42API),
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
    eventsFrom42Api.forEach(async event42 => {
      const eventInDb = await Event.findOne({
        where: { intraId: event42.id },
        raw: true,
      });
      if (!eventInDb) {
        // save new event in db
        const newEvent = await saveEventInDb(
          normalizeApiEventToSaveInDb(event42, CONSTANTS.EVENT_SOURCE_42API),
          CONSTANTS.EVENT_SOURCE_42API,
        );
        console.log(
          `🆕 new event created: ${newEvent.intraId} ${newEvent.title}`,
        );
      } else {
        if (event42.updated_at !== eventInDb.intraUpdatedAt) {
          // update event in db
          const updatedEvent = await updateEventInDb(
            normalizeApiEventToSaveInDb(event42, CONSTANTS.EVENT_SOURCE_42API),
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

const syncEveryEventsOnDbAndApi = async () => {
  try {
    const eventsFrom42Api = await get42CampusEveryEvents(SEOUL_CAMPUS_ID);
    if (!eventsFrom42Api) throw new Error('campus events not found');
    eventsFrom42Api.forEach(async event42 => {
      const eventInDb = await Event.findOne({
        where: { intraId: event42.id },
        raw: true,
      });
      if (!eventInDb) {
        // save new event in db
        const newEvent = await saveEventInDb(
          normalizeApiEventToSaveInDb(event42, CONSTANTS.EVENT_SOURCE_42API),
          CONSTANTS.EVENT_SOURCE_42API,
        );
        console.log(
          `🆕 new event created: ${newEvent.intraId} ${newEvent.title}`,
        );
      } else {
        if (event42.updated_at !== eventInDb.intraUpdatedAt) {
          // update event in db
          const updatedEvent = await updateEventInDb(
            normalizeApiEventToSaveInDb(event42, CONSTANTS.EVENT_SOURCE_42API),
          );
          console.log(
            `🆙 event updated: ${updatedEvent.intraId} ${updatedEvent.title}`,
          );
        }
      }
    });
  } catch (err) {
    console.error
  }
};

const syncUserEventsOnDbAndApi = async intraUsername => {
  try {
    console.log('syncUserEventsOnDbAndApi');
    const user = await getUserInDb(intraUsername);
    const existingUserEvents = await getUserEventsInDb(intraUsername);
    const recentestIntraIdOfExistingUserEvent = existingUserEvents.reduce(
      (prev, current) => {
        return prev.intraId > current.intraId ? prev.intraId : current.intraId;
      },
      0,
    );
    const userEventsFrom42Api = await get42UserEvents(intraUsername);

    const recentUserEvents42Api = await get42RecentUserEvents(
      intraUsername,
      recentestIntraIdOfExistingUserEvent + 1,
    );
    if (!recentUserEvents42Api) throw new Error('user events not found');

    // update new subscribed event from api to db
    recentUserEvents42Api.forEach(async userEvent42 => {
      const existingEvent = await Event.findOne({
        where: { intraId: userEvent42.id },
        raw: true,
      });
      if (!existingEvent) {
        const newEvent = await saveEventInDb(
          normalizeApiEventToSaveInDb(
            userEvent42,
            CONSTANTS.EVENT_SOURCE_42API,
          ),
          CONSTANTS.EVENT_SOURCE_42API,
        );
        console.log(
          `🆕 new event created: ${newEvent.intraId} ${newEvent.title}`,
        );
        const newUserEvent = await saveUserEventInDb(
          user.intraUsername,
          newEvent.id,
          {
            isSubscribedOnIntra: true,
            isSetReminder: false,
          },
        );
        console.log(
          `🆕 new user event created: ` +
            `${newUserEvent.intraId} ${newUserEvent.title}`,
        );
      } else {
        const existingUserEvent = await UserEvent.findOne({
          where: {
            userId: user.id,
            eventId: existingEvent.id,
          },
        });
        if (!existingUserEvent) {
          const newUserEvent = await saveUserEventInDb(
            user.intraUsername,
            existingEvent.id,
            {
              isSubscribedOnIntra: true,
              isSetReminder: false,
            },
          );
          console.log('🆕 new user event created: ', newUserEvent.title);
        }
      }
    });

    // remove cancel subscribe event from api to db
    existingUserEvents.forEach(async userEvent => {
      const isExistIn42 = userEventsFrom42Api.find(
        userEventFromApi => userEventFromApi.id === userEvent.intraId,
      );
      if (isExistIn42) return;
      await deleteUserEventInDb(userEvent.id);
      console.log(
        `🗑 user event deleted: ` + `${userEvent.intraId} ${userEvent.title}`,
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
  updateEventInDb,
  deleteEventInDb,
  saveEventInDb,
  saveUserEventInDb,
  getUserEventsInDb,
  getUserEventInDb,
  syncUpComingEventsOnDbAndApi,
  syncRecentThirtyEventsOnDbAndApi,
  syncEveryEventsOnDbAndApi,
  syncUserEventsOnDbAndApi,
};
