const schedule = require('node-schedule');
const {
  sendEventReminderToUser,
} = require('../utils/slackApi');

module.exports = {
  scheduleSlackDm: async (date, username, event) => {
    const job = schedule.scheduleJob(date, function () {
      sendEventReminderToUser(username, event);
    });
  },
};
