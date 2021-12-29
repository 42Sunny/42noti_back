const expressLoader = require('./express');
const sequelizeLoader = require('./sequelize');
const slackLoader = require('./slack');

module.exports = async (app) => {
  await expressLoader(app);
  console.log('Express Intialized');
  await sequelizeLoader();
  console.log('Sequelize Intialized');
  await slackLoader(app);
  console.log('Slack Intialized');
};
