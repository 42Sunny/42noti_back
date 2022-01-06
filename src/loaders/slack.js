const { sendMessageToUser, sendMessageToChannel } = require('../utils/slackApi');

const initServer = async () => {
  sendMessageToUser('sarchoi', 'Server is up and running!');
  // sendMessageToChannel('dev', 'Hello, world!');
};

module.exports = async () => {
  // initServer();
};
