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

const getUserEventsInDb = async intraUsername => {
  try {
    const user = await User.findOne({
      where: { intraUsername: intraUsername },
      include: [
        {
          model: Event,
          as: 'Event',
          through: {
            // NOTE: UserEvent
            where: {
              isSetReminder: true,
            },
            attributes: ['isSubscribedOnIntra', 'isSetReminder', 'remindAt'],
          },
        },
      ],
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

const saveEventInDb = async event => {
  try {
    const where = event.id ? { id: event.id } : { intraId: event.intraId };
    const existingEvent = await Event.findOne({
      where,
      raw: true,
    });
    if (existingEvent) {
      return existingEvent;
    }
    const newEvent = await Event.create(event);
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
    const beforeOneHourThenBeginAt = new Date(
      event.beginAt.getTime() - 1000 * 60 * 60,
    );
    const remindAt =
      beforeOneHourThenBeginAt > now ? beforeOneHourThenBeginAt : null;
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

const updateEventInDb = async event => {
  try {
    const where = event.id ? { id: event.id } : { intraId: event.intraId };
    const existingEvent = await Event.findOne({
      where,
    });
    if (!existingEvent) {
      return null;
    }
    const updatedEvent = await existingEvent.update(event);
    const existingUserEvent = await UserEvent.findAll({
      where: { EventId: existingEvent.id },
    });
    if (existingUserEvent) {
      const now = new Date();
      const beforeOneHourThenBeginAt = new Date(
        new Date(event.beginAt).getTime() - 1000 * 60 * 60,
      );
      const remindAt =
        beforeOneHourThenBeginAt > now ? beforeOneHourThenBeginAt : null;
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
          normalizeApiEventToSaveInDb(event42),
        );
        console.log(
          `🆕 new event created: ${newEvent.intraId} ${newEvent.title}`,
        );
      } else {
        if (event42.updated_at !== existingEvent.intraUpdatedAt) {
          // update event in db
          const updatedEvent = await updateEventInDb(
            normalizeApiEventToSaveInDb(event42),
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

const SOURCE_42_API = 1;

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
          normalizeApiEventToSaveInDb(event42, SOURCE_42_API),
        );
        console.log('newEvent: ', newEvent);
        console.log(
          `🆕 new event created: ${newEvent.intraId} ${newEvent.title}`,
        );
      } else {
        if (event42.updated_at !== eventInDb.intraUpdatedAt) {
          // update event in db
          const updatedEvent = await updateEventInDb(
            normalizeApiEventToSaveInDb(event42),
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
          normalizeApiEventToSaveInDb(userEvent42),
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
  saveUserEventInDb,
  getUserEventsInDb,
  getUserEventInDb,
  syncUpComingEventsOnDbAndApi,
  syncRecentThirtyEventsOnDbAndApi,
  syncUserEventsOnDbAndApi,
};
