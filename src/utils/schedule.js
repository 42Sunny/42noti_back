const { Op } = require('sequelize');
const schedule = require('node-schedule');
const { cacheSlackUserIds } = require('../utils/slackApi');
const { User, Event, UserEvent } = require('../models');
const { syncUpComingEventsOnDbAndApi } = require('../utils/event');
const { sendEventReminderToUser } = require('../utils/slackApi');

/*
 * scheduleJob(rule, callback)
 * sec(0-59, optional) min(0-59) hour(0-23) dayOfMonth(1-31) month(1-12) dayOfWeek(0 or 7 is sun)
 */

const syncUpComingEventsEveryMinute = () => {
  const job = schedule.scheduleJob('*/1 * * * *', () => {
    syncUpComingEventsOnDbAndApi();
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

const testSetRemindAt = async () => {
  const now = new Date(new Date().getTime() + 10 * 1000); //
  // for (let i = 1; i <= 30; i++) {
  for (let i = 1; i <= 30; i++) {
    await UserEvent.update(
      { remindAt: now },
      // { remindAt: new Date(now.getTime() + 1000 * (0.1 * i)) },
      { where: { id: i } },
    );
  }
};

module.exports = {
  syncUpComingEventsEveryMinute,
  cacheSlackUserEveryMonday3am,
};
