const { Op } = require('sequelize');
const schedule = require('node-schedule');
const { User, Event, UserEvent } = require('../models');
const {
  sendEventReminderToUser,
  sendUpdatedEventReminderToUser,
} = require('../utils/slackApi');
const cache = require('../utils/cache');
const CONSTANTS = require('./constants');

const remindEventSchedulesArray = {};

const initEveryScheduleReminderSlackDm = async () => {
  const now = new Date();
  const afterMinutes = new Date(
    now.getTime() + 1000 * 60 * CONSTANTS.REMINDER_BEFORE_EVENT_MINUTES,
  );

  const events = await Event.findAll({
    where: {
      beginAt: { [Op.gte]: afterMinutes },
    },
    attributes: [
      'id',
      'intraId',
      'title',
      'description',
      'location',
      'beginAt',
      'endAt',
    ],
    raw: true,
  });

  await Promise.all(
    events.map(async (event, i) => {
      const userEvents = await UserEvent.findAll({
        where: { EventId: event.id },
        raw: true,
      });
      await Promise.all(
        userEvents.map(async userEvent => {
          const user = await User.findOne({
            where: { id: userEvent.UserId },
            attributes: ['intraUsername'],
            raw: true,
          });
          const username = user.intraUsername;
          const remindAt = new Date(userEvent.remindAt);
          if (remindAt > now) {
            remindEventSchedulesArray[event.id] =
              remindEventSchedulesArray[event.id] || {};
            remindEventSchedulesArray[event.id][username] =
              schedule.scheduleJob(remindAt, () => {
                sendEventReminderToUser(username, event);
              });
            cache.set('remindEventSchedulesArray', remindEventSchedulesArray);
          }
        }),
      );
    }),
  );
};

const updateEveryScheduleReminderSlackDm = async eventId => {
  const now = new Date();
  const afterMinutes = new Date(
    now.getTime() + 1000 * 60 * CONSTANTS.REMINDER_BEFORE_EVENT_MINUTES,
  );

  const events = await Event.findAll({
    where: {
      id: eventId,
      beginAt: { [Op.gte]: afterMinutes },
    },
    attributes: [
      'id',
      'intraId',
      'title',
      'description',
      'location',
      'beginAt',
      'endAt',
    ],
    raw: true,
  });

  await Promise.all(
    events.map(async event => {
      const userEvents = await UserEvent.findAll({
        where: { EventId: event.id },
        raw: true,
      });
      await Promise.all(
        userEvents.map(async userEvent => {
          const user = await User.findOne({
            where: { id: userEvent.UserId },
            attributes: ['intraUsername'],
            raw: true,
          });
          const username = user.intraUsername;
          const remindAt = new Date(userEvent.remindAt);
          if (remindAt > now) {
            remindEventSchedulesArray[event.id] =
              remindEventSchedulesArray[event.id] || {};
            if (remindEventSchedulesArray[event.id][username]) {
              remindEventSchedulesArray[event.id][username].cancel();
              console.log('cancel job');
            }
            remindEventSchedulesArray[event.id][username] =
              schedule.scheduleJob(remindAt, () => {
                sendEventReminderToUser(username, event);
              });
            cache.set('remindEventSchedulesArray', remindEventSchedulesArray);
          }
        }),
      );
    }),
  );
};

const addScheduleReminderSlackDm = async (eventId, intraUsername) => {
  try {
    const now = new Date();

    const event = await Event.findOne({
      where: { id: eventId, beginAt: { [Op.gte]: now } },
      attributes: [
        'id',
        'intraId',
        'title',
        'description',
        'location',
        'beginAt',
        'endAt',
      ],
      raw: true,
    });
    const user = await User.findOne({
      where: { intraUsername: intraUsername },
      attributes: ['id', 'intraUsername'],
      raw: true,
    });
    const userEvent = await UserEvent.findOne({
      where: {
        UserId: user.id,
        EventId: event.id,
        isSetReminder: true,
      },
      attributes: ['remindAt'],
      raw: true,
    });
    if (!event) throw new Error('event not exist');
    if (!user) throw new Error('user not exist');
    if (!userEvent) throw new Error('userEvent not exist');
    console.log('userEvent', userEvent);

    const username = user.intraUsername;
    const remindAt = new Date(userEvent.remindAt);

    if (remindAt > now) {
      remindEventSchedulesArray[event.id] =
        remindEventSchedulesArray[event.id] || {};
      // check if the user has already scheduled a job
      if (remindEventSchedulesArray[event.id][username]) {
        remindEventSchedulesArray[event.id][username].cancel();
      }
      remindEventSchedulesArray[event.id][username] = schedule.scheduleJob(
        remindAt,
        () => {
          sendEventReminderToUser(username, event);
        },
      );
      cache.set('remindEventSchedulesArray', remindEventSchedulesArray);
    }
  } catch (err) {
    console.error(err);
  }
};

const removeScheduleReminderSlackDm = async (eventId, intraUsername) => {
  console.log('removeScheduleReminderSlackDm');
  try {
    const event = await Event.findOne({
      where: { id: eventId },
      attributes: [
        'id',
        'intraId',
        'title',
        'description',
        'location',
        'beginAt',
        'endAt',
      ],
      raw: true,
    });
    const user = await User.findOne({
      where: { intraUsername: intraUsername },
      attributes: ['id', 'intraUsername'],
      raw: true,
    });
    const userEvent = await UserEvent.findOne({
      where: {
        UserId: user.id,
        EventId: event.id,
        isSetReminder: false,
      },
      attributes: ['remindAt'],
      raw: true,
    });
    if (!event) throw new Error('event not exist');
    if (!user) throw new Error('user not exist');
    if (!userEvent) throw new Error('userEvent not exist');

    const username = user.intraUsername;
    if (remindEventSchedulesArray[event.id][username]) {
      remindEventSchedulesArray[event.id][username].cancel();
      delete remindEventSchedulesArray[event.id][username];
      if (Object.keys(remindEventSchedulesArray[event.id]).length === 0) {
        delete remindEventSchedulesArray[event.id];
      }
    }
    cache.set('remindEventSchedulesArray', remindEventSchedulesArray);
  } catch (err) {
    console.error(err);
  }
};

const sendEveryoneUpdatedEventSlackDm = async eventId => {
  const event = await Event.findOne({
    where: {
      id: eventId,
    },
    attributes: [
      'id',
      'intraId',
      'title',
      'description',
      'location',
      'beginAt',
      'endAt',
    ],
    raw: true,
  });

  const userEvents = await UserEvent.findAll({
    where: { EventId: event.id },
    raw: true,
  });
  await Promise.all(
    userEvents.map(async userEvent => {
      const user = await User.findOne({
        where: { id: userEvent.UserId },
        attributes: ['intraUsername'],
        raw: true,
      });
      const username = user.intraUsername;
      await sendUpdatedEventReminderToUser(username, event);
    }),
  );
};

module.exports = {
  initEveryScheduleReminderSlackDm,
  updateEveryScheduleReminderSlackDm,
  addScheduleReminderSlackDm,
  removeScheduleReminderSlackDm,
  sendEveryoneUpdatedEventSlackDm,
};
