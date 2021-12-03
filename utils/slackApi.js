const { App } = require('@slack/bolt');
const { WebClient, LogLevel } = require('@slack/web-api');
const env = require('../config');

const SLACK_BOT_TOKEN = env.slack_bot_token;
const SLACK_SIGNING_SECRET = env.slack_signing_secret;

const app = new App({
  token: SLACK_BOT_TOKEN,
  signingSecret: SLACK_SIGNING_SECRET,
});

const client = new WebClient(SLACK_BOT_TOKEN, {
  // LogLevel can be imported and used to make debugging simpler
  logLevel: LogLevel.DEBUG,
});

module.exports = {
  findChannelId: async name => {
    try {
      const result = await app.client.conversations.list({
        token: SLACK_BOT_TOKEN,
      });

      for (const channel of result.channels) {
        if (channel.name === name) {
          conversationId = channel.id;
          return conversationId;
          break;
        }
      }
    } catch (error) {
      console.error(error);
    }
  },

  findUserIdByUsername: async username => {
    try {
      const result = await app.client.users.list({
        token: SLACK_BOT_TOKEN,
      });

      // TODO: find user id from 'Login 42' in 42born2code workspace
      for (const user of result.members) {
        if (user.real_name === username) {
          return user.id;
          break;
        }
      }
    } catch (error) {
      console.error(error);
    }
  },

  findDmChannelId: async userId => {
    try {
      console.log(userId);
      const result = await app.client.conversations.open({
        token: SLACK_BOT_TOKEN,
        users: userId,
      });

      return result.channel.id;
    } catch (error) {
      console.error(error);
    }
  },

  sendMessage: async (channelId, message) => {
    try {
      const result = await client.chat.postMessage({
        channel: channelId,
        text: message,
      });
      if (result.ok === true) console.log('Message sent!');
    } catch (error) {
      console.error(error);
    }
  },
};
