const expressLoader = require('./express');
const slackLoader = require('./slack');

module.exports = async (app) => {
  await expressLoader(app);
  console.log('Express Intialized');
  await slackLoader(app);
  console.log('Slack Intialized');
};
