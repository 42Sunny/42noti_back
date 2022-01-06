const expressLoader = require('./express');
const sequelizeLoader = require('./sequelize');
const slackLoader = require('./slack');
const initLoader = require('./init');

module.exports = async (app) => {
  await expressLoader(app);
  console.log('Express Intialized');
  await sequelizeLoader();
  console.log('Sequelize Intialized');
  await slackLoader(app);
  console.log('Slack Intialized');
  await initLoader();
  console.log('Init Intialized');
};
