const httpStatus = require('http-status');
const CONSTANTS = require('../utils/constants');
const {
  getCampusEvents,
  getEvent,
  updateEvent,
  deleteEvent,
} = require('../services/event.service');
const { getUser } = require('../services/user.service');
const { Event } = require('../models');

const checkAuthority = async (userRole, source) => {
  if (userRole === 'admin') return true;
  if (source === 'mock') return true;
  if (source === 'cadet' && userRole === 'cadet') return true;
  // TODO: add (event.createdBy === intraUsername)
  return false;
}

const checkRequiredFields = async (event) => {
  if (
    !event.title ||
    !event.description ||
    !event.category ||
    !event.beginAt ||
    !event.endAt
  ) {
    return false;
  }
  return true;
}

const changeUtc9toUtc0 = (date) => {
  return new Date(new Date(date).getTime() - 9 * 60 * 60 * 1000);
}

const postEventController = async (req, res) => {
  const intraUsername = req.user.jwt.name;
  const body = req.body;

  const existingUser = await getUser(intraUsername);
  if (!checkAuthority(existingUser.role, body.source)) {
    return res.status(httpStatus.FORBIDDEN).json({ message: ' Forbidden' });
  }
  if (!checkRequiredFields(body.event)) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: 'Required field is missing',
    });
  }

  const eventData = {
    intraId: null,
    intraCreatedAt: null,
    intraUpdatedAt: null,
    title: body.event.title,
    description: body.event.description,
    location: body.event.location,
    maxSubscribers: body.event.maxSubscribers,
    currentSubscribers: 0,
    beginAt: changeUtc9toUtc0(body.event.beginAt),
    endAt: changeUtc9toUtc0(body.event.endAt),
    category: body.event.category,
    tags: JSON.stringify(
      body.event.tags.map(tag => {
        return { name: tag };
      }),
    ),
  };
  const savedEvent = await Event.saveEvent(eventData, CONSTANTS.EVENT_SOURCE[body.source]);
  const parse = JSON.parse(savedEvent.dataValues.tags);
  const resTags = parse.map(tag => tag.name);
  return res.status(httpStatus.OK).json({
    ...savedEvent.dataValues,
    tags: resTags,
  });
};

const putEventController = async (req, res) => {
  const intraUsername = req.user.jwt.name;
  const eventId = req.params.eventId;
  const body = req.body;

  const existingUser = await getUser(intraUsername);
  const existingEvent = await getEvent(eventId);
  if (!existingEvent) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: 'Event not found',
    });
  }
  if (!checkAuthority(existingUser.role, existingEvent.source)) {
    return res.status(httpStatus.FORBIDDEN).json({ message: 'Forbidden' });
  }
  if (!checkRequiredFields(body.event)) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: 'Required field is missing',
    });
  }

  const newEventData = {
    title: body.event.title,
    description: body.event.description,
    location: body.event.location,
    maxSubscribers: body.event.maxSubscribers,
    beginAt: changeUtc9toUtc0(body.event.beginAt),
    endAt: changeUtc9toUtc0(body.event.endAt),
    category: body.event.category,
    tags: JSON.stringify(
      body.event.tags.map(tag => {
        return { name: tag };
      }),
    ),
  };
  const updatedEvent = await updateEvent(eventId, newEventData);
  return res.status(httpStatus.OK).json(updatedEvent);
};

const deleteEventController = async (req, res) => {
  const intraUsername = req.user.jwt.name;
  const eventId = req.params.eventId;

  const existingUser = await getUser(intraUsername);
  const existingEvent = await getEvent(eventId);
  if (!existingEvent) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: 'Event not found',
    });
  }
  if (!checkAuthority(existingUser.role, existingEvent.source)) {
    return res.status(httpStatus.FORBIDDEN).json({
      message: 'Forbidden',
    });
  }

  const result = await deleteEvent(eventId);
  if (!result) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to delete event',
    });
  }
  return res.status(httpStatus.OK).json({
    message: 'Event deleted',
  });
};

const eventsController = async (req, res) => {
  const { range, source, update, page, limit } = req.query;
  const options = {
    range: range || 'upcoming',
    includeSources:
      (source && source.split(',')) || '42api,admin,cadet'.split(','),
    forceUpdate: update === 'force' || false,
    page: page || 1,
    limit: limit || 10,
  };
  try {
    const data = await getCampusEvents(options);
    if (!data) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: 'campus events not found',
      });
    }
    return res.json(data);
  } catch (err) {
    console.error(err);
  }
};

const eventController = async (req, res) => {
  const { eventId } = req.params;
  try {
    const data = await getEvent(eventId);
    if (!data) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: 'event not found',
      });
    }
    return res.json(data);
  } catch (err) {
    console.error(err);
  }
};

module.exports = {
  eventsController,
  eventController,
  postEventController,
  putEventController,
  deleteEventController,
};
