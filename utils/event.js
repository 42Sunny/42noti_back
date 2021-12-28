const { Op } = require('sequelize');
const Event = require('../models/event');
const User = require('../models/user');
const UserEvent = require('../models/userEvent');

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
      tags: () => {
        const parse = JSON.parse(dbEvent.tags);
        return parse.map(tag => tag.name);
      },
      createdAt: dbEvent.intraCreatedAt,
      updatedAt: dbEvent.intraUpdatedAt,
    };
  },
  getUserInDb: async userId => {
    const user = await User.findOne({
      where: { intraLogin: userId },
      raw: true
    });
    if (!user) {
      return null;
    }
    return user;
  },
  getEventsInDb: async query => {
    if (!query) {
      const events = await Event.findAll({
        where: {
          beginAt: { [Op.gte]: new Date() },
        },
        order: [['beginAt', 'DESC']],
        raw: true,
      });
      return events.map(event => event.dataValues);
    }
    const events = await Event.findAll({
      where: query,
      order: [['beginAt', 'DESC']],
      raw: true,
    });
    return events.map(event => event.dataValues);
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
        where: { intraLogin: userId },
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
      const newUserEvent = await UserEvent.create({
        UserId: user.id,
        EventId: event.id,
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
        raw: true,
      });
      if (!foundEvent) {
        return null;
      }
      const updatedEvent = await foundEvent.update(event);
      return updatedEvent;
    } catch (err) {
      console.error(err);
    }
  },
};
