const schedule = require('node-schedule');
const { cacheSlackUserIds } = require('../utils/slackApi');
const { syncUpComingEventsFrom42 } = require('../utils/event');

/*
 * scheduleJob(rule, callback)
 * sec(0-59, optional) min(0-59) hour(0-23) dayOfMonth(1-31) month(1-12) dayOfWeek(0 or 7 is sun)
 */

const syncUpComingEventsEveryMinute = () => {
  const job = schedule.scheduleJob('*/1 * * * *', () => {
    syncUpComingEventsFrom42();
  });
  return job;
};

const cacheSlackUserEveryMonday3am = () => {
  // At 03:00 on Monday
  const job = schedule.scheduleJob('0 3 * * 1', () => {
    cacheSlackUserIds();
  });
  return job;
};

module.exports = {
  syncUpComingEventsEveryMinute,
  cacheSlackUserEveryMonday3am,
};
