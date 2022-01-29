const { sendMessageToUser, sendMessageToChannel } = require('../utils/slackApi');

module.exports = async () => {
  sendMessageToUser('sarchoi', 'Server is up and running!');
  // sendMessageToChannel('dev', 'Hello, world!');
};
