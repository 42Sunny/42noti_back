const { Op } = require('sequelize');
const Event = require('../models/event.model');
const User = require('../models/user.model');
const UserEvent = require('../models/userEvent.model');

module.exports = {
  normalizeApiEventToSaveInDb: originalEvent => {
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
  },
  normalizeDbEventToResponse: dbEvent => {
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
  },
  getEventsInDb: async query => {
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
  },
  getEventInDb: async eventId => {
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
  },
  getUserEventsInDb: async userId => {
    try {
      const user = await User.findOne({
        where: { intraUsername: userId },
      });
      const userEvents = await user.getEvent();
      return userEvents.map(userEvent => userEvent.dataValues);
    } catch (err) {
      console.error(err);
    }
  },
  saveEventInDb: async event => {
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
  },
  saveUserEventInDb: async (user, event) => {
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
  },
  updateEventInDb: async event => {
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
          beforeOneHourThenBeginAt > now ? beforeOneHourThenBeginAt : NULL;
        foundUserEvent.forEach(async userEvent => {
          await userEvent.update({ remindAt });
        });
      }
      return updatedEvent;
    } catch (err) {
      console.error(err);
    }
  },
};
