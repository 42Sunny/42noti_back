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

const postEventController = async (req, res) => {
  const intraUsername = req.user.jwt.name;
  const body = req.body;

  const existingUser = await getUser(intraUsername);
  if (
    !(
      existingUser.role === 'admin' ||
      body.source === 'mock' || // TODO: add user role check
      (body.source === 'cadet' && existingUser.role === 'cadet')
    )
  ) {
    return res.status(httpStatus.FORBIDDEN).json({ message: ' Forbidden' });
  }

  if (
    !body.event.title ||
    !body.event.description ||
    !body.event.category ||
    !body.event.beginAt ||
    !body.event.endAt
  ) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: 'Required field is missing',
    });
  }

  // utc+9 to utc-0
  const beginAt = new Date(
    new Date(body.event.beginAt).getTime() - 9 * 60 * 60 * 1000,
  );
  const endAt = new Date(
    new Date(body.event.endAt).getTime() - 9 * 60 * 60 * 1000,
  );
  const tags = body.event.tags.map(tag => {
    return { name: tag };
  });
  const eventData = {
    intraId: null,
    intraCreatedAt: null,
    intraUpdatedAt: null,
    title: body.event.title,
    description: body.event.description,
    location: body.event.location,
    maxSubscribers: body.event.maxSubscribers,
    currentSubscribers: 0,
    beginAt,
    endAt,
    category: body.event.category,
    tags: JSON.stringify(tags),
  };
  let source;
  if (body.source === '42api') source = CONSTANTS.EVENT_SOURCE_42API;
  else if (body.source === 'admin') source = CONSTANTS.EVENT_SOURCE_ADMIN;
  else if (body.source === 'cadet') source = CONSTANTS.EVENT_SOURCE_CADET;
  else if (body.source === 'mock') source = CONSTANTS.EVENT_SOURCE_MOCK;
  else source = 0;

  const savedEvent = await Event.saveEvent(eventData, source);
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
  console.log('event: ', existingEvent);

  if (
    !(
      (
        existingUser.role === 'admin' ||
        existingEvent.source === 'mock' || // TODO: add user role check
        (existingEvent.source === 'cadet' && existingUser.role === 'cadet')
      )
      // TODO: add (event.createdBy === intraUsername)
    )
  ) {
    return res.status(httpStatus.FORBIDDEN).json({
      message: 'Forbidden',
    });
  }

  if (
    !body.event.title ||
    !body.event.description ||
    !body.event.category ||
    !body.event.beginAt ||
    !body.event.endAt
  ) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: 'Required field is missing',
    });
  }

  // utc+9 to utc-0
  const beginAt = new Date(
    new Date(body.event.beginAt).getTime() - 9 * 60 * 60 * 1000,
  );
  const endAt = new Date(
    new Date(body.event.endAt).getTime() - 9 * 60 * 60 * 1000,
  );
  const tags = body.event.tags.map(tag => {
    return { name: tag };
  });
  const newEventData = {
    title: body.event.title,
    description: body.event.description,
    location: body.event.location,
    maxSubscribers: body.event.maxSubscribers,
    beginAt,
    endAt,
    category: body.event.category,
    tags: JSON.stringify(tags),
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

  // prettier-ignore
  if (!(
    existingUser.role === 'admin' ||
    existingEvent.source === 'mock' || // TODO: add user role check
    (existingEvent.source === 'cadet' && existingUser.role === 'cadet')
    // TODO: add (event.createdBy === intraUsername)
  )) {
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
