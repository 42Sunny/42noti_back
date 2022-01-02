const expressLoader = require('./express');
const sequelizeLoader = require('./sequelize');
const slackLoader = require('./slack');
const cacheLoader = require('./cache');
const scheduleLoader = require('./schedule');

module.exports = async (app) => {
  await expressLoader(app);
  console.log('Express Intialized');
  await sequelizeLoader();
  console.log('Sequelize Intialized');
  await slackLoader(app);
  console.log('Slack Intialized');
  await cacheLoader();
  console.log('Cache Intialized');
  await scheduleLoader();
  console.log('Schedule Intialized');
};
