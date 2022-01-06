const { Op } = require('sequelize');
const schedule = require('node-schedule');
const { User, Event, UserEvent } = require('../models');
const { sendEventReminderToUser } = require('../utils/slackApi');
const cache = require('../utils/cache');

const remindEventSchedulesArray = {};

const initScheduleReminderSlackDm = async () => {
  console.log('initScheduleReminderSlackDm');
  const now = new Date();
  const afterOneHour = new Date(now.getTime() + 1000 * 60 * 60);

  const events = await Event.findAll({
    where: {
      beginAt: { [Op.gte]: afterOneHour },
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
    })
  );
};

module.exports = {
  remindEventSchedulesArray,
  initScheduleReminderSlackDm,
};
