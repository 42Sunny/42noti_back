const {
  normalizeEventToResponse,
  // syncUserEventsFrom42,
} = require('../utils/event');
const { User, Event, UserEvent } = require('../models');
const {
  addScheduleReminderSlackDm,
  removeScheduleReminderSlackDm,
} = require('../utils/reminder');

const getUserEvents = async intraUsername => {
  // await syncUserEventsFrom42(intraUsername); // TODO: do this only force update.
  const user = await User.getUser(intraUsername);
  const userEvents = await UserEvent.getUserEventsByUserId(user.id);
  if (!userEvents) {
    return null;
  }

  const events = await Promise.all(
    userEvents.map(async userEvent => {
      const event = await Event.getEvent(userEvent.EventId);
      if (!event)
        return null;
      return normalizeEventToResponse(event);
    }),
  );
  return events.filter(event => event !== null);
};

const getUserEvent = async (intraUsername, eventId) => {
  const user = await User.getUser(intraUsername);
  const userEvent = await UserEvent.getUserEvent(user.id, eventId);
  if (!userEvent) {
    return null;
  }
  const event = await Event.getEvent(userEvent.EventId);
  return normalizeEventToResponse(event);
};

const getUserEventReminderStatus = async (intraUsername, eventId) => {
  try {
    const user = await User.getUser(intraUsername);

    const userEvent = await UserEvent.findOne({
      where: {
        userId: user.id,
        eventId: eventId,
      },
      raw: true,
    });
    if (!userEvent) {
      return null;
    }
    return userEvent.isSetReminder ? true : false;
  } catch (err) {
    console.error(err);
  }
};

const setUserEventReminderOn = async (intraUsername, eventId, remindAt) => {
  try {
    const user = await User.getUser(intraUsername);

    const userEvent = await UserEvent.findOne({
      where: {
        UserId: user.id,
        EventId: eventId,
      },
    });
    if (!userEvent) {
      return null;
    }
    userEvent.isSetReminder = true;
    userEvent.remindAt = remindAt;
    await userEvent.save();
    await addScheduleReminderSlackDm(eventId, intraUsername);
    return userEvent;
  } catch (err) {
    console.error(err);
  }
};

const setUserEventReminderOff = async (intraUsername, eventId) => {
  try {
    const user = await User.getUser(intraUsername);

    const userEvent = await UserEvent.findOne({
      where: {
        userId: user.id,
        eventId: eventId,
      },
    });
    if (!userEvent) {
      return null;
    }
    userEvent.isSetReminder = false;
    userEvent.remindAt = null;
    await userEvent.save();
    await removeScheduleReminderSlackDm(eventId, intraUsername);
    return userEvent;
  } catch (err) {
    console.error(err);
  }
};

module.exports = {
  getUserEvents,
  getUserEvent,
  getUserEventReminderStatus,
  setUserEventReminderOn,
  setUserEventReminderOff,
};
