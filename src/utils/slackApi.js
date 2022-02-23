const { App } = require('@slack/bolt');
const { WebClient, LogLevel } = require('@slack/web-api');
const env = require('../config');
const cache = require('./cache');
const { User } = require('../models');
const logger = require('./winston');

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

const getUserList = async () => {
  let resultAll = [];
  let nextCursor = null;

  while (nextCursor !== "") {
    result = await app.client.users.list({
      token: SLACK_BOT_TOKEN,
      limit: 1000,
      cursor: nextCursor
    });
    resultAll = [...resultAll, ...result.members];
    nextCursor = result.response_metadata.next_cursor;
  }

  const members = resultAll.filter(
    member => member.deleted !== true && member.is_bot === false,
  );
  cache.set('slack-userList', members);
  return members;
}

const getCachedUserList = async () => {
  const cachedUserList = cache.get('slack-userList');
  if (cachedUserList) {
    return JSON.parse(cachedUserList);
  }
  const userList = await getUserList();
  cache.set('slack-userList', JSON.stringify(userList));
  return userList;
};

const findUserIdByUsername = async username => {
  console.log('findUserIdByUsername: ', username);
  try {
    const userList = await getCachedUserList();
    const user = userList.find(member => member.name === username || member.real_name === username);

    if (!user) {
      throw new Error(`User not found: ${username}`);
    }
    return user.id;
  } catch (error) {
    console.error(error);
  }
};

const findDmChannelId = async username => {
  try {
    const result = await findUserIdByUsername(username);
    return result;
  } catch (error) {
    console.error(error);
  }
};

const findCachedDmChannelId = async username => {
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
    logger.error(error);
  }
};

const sendEventReminder = async (channelId, event) => {
  const beginAt = new Date(new Date(event.beginAt).getTime() + 9 * 60 * 60 * 1000);
  const endAt = new Date(new Date(event.endAt).getTime() + 9 * 60 * 60 * 1000);

  const zeroPad = (value) => value < 10 ? `0${value}` : value;
  const beginAtString = `${beginAt.getFullYear()}/${beginAt.getMonth() + 1}/${beginAt.getDate()} ${zeroPad(beginAt.getHours())}:${zeroPad(beginAt.getMinutes())}`;
  const endAtString = `${endAt.getFullYear()}/${endAt.getMonth() + 1}/${endAt.getDate()} ${zeroPad(endAt.getHours())}:${zeroPad(endAt.getMinutes())}`;

  try {
    const result = await client.chat.postMessage({
      channel: channelId,
      text: `⏰ 곧 시작합니다: ${event.title}`,
      blocks: [
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '⏰ 이벤트가 곧 시작합니다.',
            },
          ],
        },
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
    logger.error(error);
  }
};

const sendUpdatedEventReminder = async (channelId, event) => {
  const beginAt = new Date(new Date(event.beginAt).getTime() + 9 * 60 * 60 * 1000);
  const endAt = new Date(new Date(event.endAt).getTime() + 9 * 60 * 60 * 1000);

  const zeroPad = value => (value < 10 ? `0${value}` : value);
  const beginAtString = `${beginAt.getFullYear()}/${
    beginAt.getMonth() + 1
  }/${beginAt.getDate()} ${zeroPad(beginAt.getHours())}:${zeroPad(
    beginAt.getMinutes(),
  )}`;
  const endAtString = `${endAt.getFullYear()}/${
    endAt.getMonth() + 1
  }/${endAt.getDate()} ${zeroPad(endAt.getHours())}:${zeroPad(
    endAt.getMinutes(),
  )}`;

  try {
    const result = await client.chat.postMessage({
      channel: channelId,
      text: `👀 업데이트 확인하기: ${event.title}`,
      blocks: [
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '👀 이벤트가 업데이트 되었습니다.',
            },
          ],
        },
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

const cacheSlackUserIds = async () => {
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
        const dmChannelId = await findCachedDmChannelId(username);
        cache.set(`slack-dmChannelId-${username}`, dmChannelId);
      })
    ));
  } catch (error) {
    console.error(error);
  }
};

const sendMessageToUser = async (username, message) => {
  try {
    const dmChannelId = await findCachedDmChannelId(username);
    await sendMessage(dmChannelId, message);
    logger.info(`Message sent to ${username}: ${message}`);
  } catch (error) {
    console.error(error);
  }
};

const sendEventReminderToUser = async (username, event) => {
  try {
    const dmChannelId = await findCachedDmChannelId(username);
    await sendEventReminder(dmChannelId, event);
    logger.info(`Event remind message sent to ${username}: ${event.title}`);
  } catch (error) {
    logger.error(error);
  }
};

const sendUpdatedEventReminderToUser = async (username, event) => {
  try {
    const dmChannelId = await findCachedDmChannelId(username);
    await sendUpdatedEventReminder(dmChannelId, event);
    logger.info(`Updated event message sent to ${username}: ${event.title}`);
  } catch (error) {
    logger.error(error);
  }
};

const sendMessageToChannel = async (channelName, message) => {
  try {
    const channelId = await findChannelIdCache(channelName);
    await sendMessage(channelId, message);
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  cacheSlackUserIds,
  sendMessageToUser,
  sendEventReminderToUser,
  sendUpdatedEventReminderToUser,
  sendMessageToChannel,
};
