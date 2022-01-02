const { Op } = require('sequelize');
const schedule = require('node-schedule');
const { cacheSlackUserIds } = require('../utils/slackApi');
const { scheduleSlackDm } = require('../utils/schedule');
const { User, Event, UserEvent } = require('../models');

/*
 * scheduleJob(rule, callback)
 * sec(0-59, optional) min(0-59) hour(0-23) dayOfMonth(1-31) month(1-12) dayOfWeek(0 or 7 is sun)
 */

const everyMonday3am = () => {
  // At 03:00 on Monday
  const job = schedule.scheduleJob('0 3 * * 1', function () {
    cacheSlackUserIds();
  });
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

const initScheduleSlackDm = async () => {
  const now = new Date();
  const userEvents = await UserEvent.findAll({
    where: { remindAt: { [Op.gt]: now } },
    raw: true,
  });
  if (!userEvents) {
    return;
  }

  userEvents.forEach(async userEvent => {
    const { remindAt, UserId, EventId } = userEvent;
    const user = await User.findOne({
      where: { id: UserId },
      attributes: ['intraUsername'],
      raw: true,
    });
    const username = user.intraUsername;
    const event = await Event.findOne({
      where: { id: EventId },
      attributes: [
        'intraId',
        'title',
        'description',
        'location',
        'beginAt',
        'endAt',
      ],
      raw: true,
    });
    console.log(username, remindAt, event.title);
    await scheduleSlackDm(remindAt, username, event);
  });
};

module.exports = async () => {
  // scheduleSlackDm();
  everyMonday3am();
  // await testSetRemindAt();
  await initScheduleSlackDm();
};
