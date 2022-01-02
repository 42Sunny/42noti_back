const cache = require('../utils/cache');
const { cacheSlackUserIds } = require('../utils/slackApi');

const cacheSlack = async () => {
  await cacheSlackUserIds();
}

module.exports = async () => {
  cacheSlack();
}
