const {
  findChannelId,
  findDmChannelId,
  findUserIdByUsername,
  sendMessage,
} = require('../utils/slackApi');

const test = async () => {
  const devChannelId = await findChannelId('dev');
  await sendMessage(devChannelId, 'Hello, world!');

  const sarchoiUserId = await findUserIdByUsername('sarchoi');
  const sarchoiDmChannelId = await findDmChannelId(sarchoiUserId);
  await sendMessage(sarchoiDmChannelId, 'Hello, DM!');
};

module.exports = async () => {
  test();
};
