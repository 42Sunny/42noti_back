const env = require('../config');
const { syncEveryEventsFrom42 } = require('../utils/event');
const { cacheSlackUserIds, sendMessageToUser } = require('../utils/slackApi');
const { initEveryScheduleReminderSlackDm } = require('../utils/reminder');
const {
  syncUpComingEventsEveryMinute,
  cacheSlackUserEveryMonday3am,
} = require('../utils/schedule');

const scheduling = async () => {
  await syncUpComingEventsEveryMinute();
  await cacheSlackUserEveryMonday3am();
};

module.exports = async () => {
  if (env.NODE_ENV === 'development') {
    await syncEveryEventsFrom42();
  }
  await cacheSlackUserIds();
  await scheduling();
  await initEveryScheduleReminderSlackDm();
  await sendMessageToUser('sarchoi', 'Server is up and running!');
};
