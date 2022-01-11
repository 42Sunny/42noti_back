const { App } = require('@slack/bolt');
const { WebClient, LogLevel } = require('@slack/web-api');
const env = require('../config');
const cache = require('./cache');
const User = require('../models/user.model');

const SLACK_BOT_TOKEN = env.slack.botToken;
const SLACK_SIGNING_SECRET = env.slack.secret;

const app = new App({
  token: SLACK_BOT_TOKEN,
  signingSecret: SLACK_SIGNING_SECRET,
});

const client = new WebClient(SLACK_BOT_TOKEN, {
  // LogLevel can be imported and used to make debugging simpler
  logLevel: LogLevel.DEBUG,
});

const findChannelId = async name => {
  console.log('findChannelId: ', name);
  try {
    const result = await app.client.conversations.list({
      token: SLACK_BOT_TOKEN,
    });

    for (const channel of result.channels) {
      if (channel.name === name) {
        conversationId = channel.id;
        return conversationId;
      }
    }
  } catch (error) {
    console.error(error);
  }
};

const findChannelIdCache = async name => {
  console.log('findChannelIdCache: ', name);
  try {
    const cached = cache.get(`slack-channelId-${name}`);
    if (cached) {
      return cached;
    }
    const result = await findChannelId(name);
    cache.set(`slack-channelId-${name}`, result);
    return result;
  } catch (error) {
    console.error(error);
  }
};

const findUserIdByUsername = async username => {
  console.log('findUserIdByUsername: ', username);
  try {
    const result = await app.client.users.list({
      token: SLACK_BOT_TOKEN,
    });

    // TODO: find user id from 'Login 42' in 42born2code workspace
    for (const user of result.members) {
      if (user.real_name === username) {
        return user.id;
      }
    }
  } catch (error) {
    console.error(error);
  }
};

const findDmChannelId = async username => {
  try {
    console.log(username);
    const userId = await findUserIdByUsername(username);
    const result = await app.client.conversations.open({
      token: SLACK_BOT_TOKEN,
      users: userId,
    });
    if (result.ok === false) {
      console.log('Error(findDmChannelId): ', username, result.error);
      return null;
    }

    return result.channel.id;
  } catch (error) {
    console.error(error);
  }
};

const findDmChannelIdCache = async username => {
  console.log('findDmChannelIdCache: ', username);
  try {
    const cached = cache.get(`slack-dmChannelId-${username}`);
    if (cached) {
      return cached;
    }
    const result = await findDmChannelId(username);
    if (!result) {
      return null;
    }
    cache.set(`slack-dmChannelId-${username}`, result);
    return result;
  } catch (error) {
    console.error(error);
  }
};

const sendMessage = async (channelId, message) => {
  try {
    const result = await client.chat.postMessage({
      channel: channelId,
      text: message,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message,
          },
        },
      ],
    });
    if (result.ok === true) console.log('Message sent!');
  } catch (error) {
    console.error(error);
  }
};

const sendEventReminder = async (channelId, event) => {
  const beginAt = new Date(event.beginAt);
  const endAt = new Date(event.endAt);

  const zeroPad = (value) => value < 10 ? `0${value}` : value;
  const beginAtString = `${beginAt.getFullYear()}/${
    beginAt.getMonth() + 1
  }/${beginAt.getDate()} ${zeroPad(
    beginAt.getHours(),
  )}:${zeroPad(beginAt.getMinutes())}`;
  const endAtString = `${endAt.getFullYear()}/${
    endAt.getMonth() + 1
  }/${endAt.getDate()} ${zeroPad(
    endAt.getHours(),
  )}:${zeroPad(endAt.getMinutes())}`;

  try {
    const result = await client.chat.postMessage({
      channel: channelId,
      text: `⏰ ${event.title}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${event.title}`,
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `- 일시: ${beginAtString} - ${endAtString}\n - 장소: ${event.location}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: event.description,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '자세히 보러가기',
                emoji: true,
              },
              value: 'click_me_123',
              url: `${env.frontUrl}/detail/${event.id}`,
              action_id: 'actionId-0',
            },
          ],
        },
      ],
    });
    if (result.ok === true) console.log('Message sent!');
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  cacheSlackUserIds: async () => {
    console.log('cacheSlackUserIds');
    try {
      const users = await User.findAll({
        attributes: ['intraUsername'],
        group: ['intraUsername'],
        raw: true,
      })
      const intraUsernameArray = users.map(user => user.intraUsername);
      console.log(intraUsernameArray);
      Promise.all((
        intraUsernameArray.map(async username => {
          if (cache.has(`slack-dmChannelId-${username}`)) {
            return;
          }
          const dmChannelId = await findDmChannelIdCache(username);
          cache.set(`slack-dmChannelId-${username}`, dmChannelId);
        })
      ));
    } catch (error) {
      console.error(error);
    }
  },
  sendMessageToUser: async (username, message) => {
    try {
      const dmChannelId = await findDmChannelIdCache(username);
      await sendMessage(dmChannelId, message);
    } catch (error) {
      console.error(error);
    }
  },
  sendEventReminderToUser: async (username, event) => {
    try {
      const dmChannelId = await findDmChannelIdCache(username);
      await sendEventReminder(dmChannelId, event);
    } catch (error) {
      console.error(error);
    }
  },
  sendMessageToChannel: async (channelName, message) => {
    try {
      const channelId = await findChannelIdCache(channelName);
      await sendMessage(channelId, message);
    } catch (error) {
      console.error(error);
    }
  },
};
