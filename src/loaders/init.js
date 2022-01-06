const { syncRecentThirtyEventsOnDbAndApi } = require('../utils/event');
const { cacheSlackUserIds } = require('../utils/slackApi');
const { initScheduleReminderSlackDm } = require('../utils/reminder');
const {
  syncUpComingEventsEveryMinute,
  cacheSlackUserEveryMonday3am,
} = require('../utils/schedule');

const scheduling = async () => {
  await syncUpComingEventsEveryMinute();
  await cacheSlackUserEveryMonday3am();
};

module.exports = async () => {
  await syncRecentThirtyEventsOnDbAndApi();
  await cacheSlackUserIds();
  await initScheduleReminderSlackDm();
  await scheduling();
};
