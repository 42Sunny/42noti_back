const { User, Event, UserEvent } = require('../models');
const {
  get42CampusUpComingEvents,
  get42CampusEveryEvents,
  get42RecentUserEvents,
  get42CampusCadetUpComingExams,
  get42CampusCadetEveryExams,
} = require('./42api');
const CONSTANTS = require('./constants');

const _normalize42EventToSaveInDb = (originalEvent, source) => {
  return {
    intraId: originalEvent.id,
    title: originalEvent.name,
    description: originalEvent.description,
    location: originalEvent.location,
    category: originalEvent.kind,
    maxSubscribers: originalEvent.max_people,
    currentSubscribers: originalEvent.nbr_subscribers,
    beginAt: originalEvent.begin_at,
    endAt: originalEvent.end_at,
    tags: JSON.stringify(originalEvent.themes),
    intraCreatedAt: originalEvent.created_at,
    intraUpdatedAt: originalEvent.updated_at,
    source,
  };
};

const _normalize42ExamToSaveInDb = originalExam => {
  const makeDescription = projects => {
    let description = 'This session concerns only the following exams : ';
    projects.forEach((project, index, array) => {
      if (index === 0) {
        description += project.name;
        return;
      }
      if (index === array.length - 1) {
        description += ` and ${project.name}.\n\n`;
        return;
      }
      description += `, ${project.name}`;
    });
    description += '\n\n다음 시험이 진행됩니다 :\n\n';
    projects.forEach(project => {
      description += `- ${project.name}\r\n`;
    });
    return description;
  };
  return {
    intraId: originalExam.id,
    title: originalExam.name,
    description: makeDescription(originalExam.projects),
    location: originalExam.location,
    category: 'exam',
    maxSubscribers: originalExam.max_people,
    currentSubscribers: originalExam.nbr_subscribers,
    beginAt: originalExam.begin_at,
    endAt: originalExam.end_at,
    tags: '[]',
    intraCreatedAt: originalExam.created_at,
    intraUpdatedAt: originalExam.updated_at,
    source: CONSTANTS.EVENT_SOURCE_42API,
  };
};

const normalizeEventToResponse = dbEvent => {
  try {
    const parse = JSON.parse(dbEvent.tags);
    const tags = parse.map(tag => tag.name);
    const createdAt = dbEvent.intraCreatedAt
      ? dbEvent.intraCreatedAt
      : dbEvent.createdAt;
    const updatedAt = dbEvent.intraUpdatedAt
      ? dbEvent.intraUpdatedAt
      : dbEvent.updatedAt;
    let source;
    if (dbEvent.source === CONSTANTS.EVENT_SOURCE_42API) source = '42api';
    else if (dbEvent.source === CONSTANTS.EVENT_SOURCE_ADMIN) source = 'admin';
    else if (dbEvent.source === CONSTANTS.EVENT_SOURCE_CADET) source = 'cadet';
    else if (dbEvent.source === CONSTANTS.EVENT_SOURCE_MOCK) source = 'mock';

    return {
      id: dbEvent.id,
      intraId: dbEvent.intraId,
      title: dbEvent.title,
      description: dbEvent.description,
      location: dbEvent.location,
      category: dbEvent.category, // NOTE: deprecated
      maxSubscribers: dbEvent.maxSubscribers,
      currentSubscribers: dbEvent.currentSubscribers,
      beginAt: dbEvent.beginAt,
      endAt: dbEvent.endAt,
      tags,
      createdAt,
      updatedAt,
      source,
    };
  } catch (err) {
    console.error(err);
  }
};

const updateUserEventsRemindAt = async (eventId, remindAt) => {
  try {
    const now = new Date();
    const userEvents = await UserEvent.getUserEventsByEventId(eventId);
    if (!userEvents) {
      return;
    }
    userEvents.forEach(async userEvent => {
      await UserEvent.updateUserEvent(userEvent.UserId, userEvent.EventId, {
        remindAt: remindAt > now ? remindAt : null,
      });
    });
  } catch(err) {
    console.error(err);
  }
}

const _syncEvents = events => {
  events.forEach(async event42 => {
    const existingEvent = await Event.getEventByIntraId(event42.id);
    if (!existingEvent) {
      // save new event in db
      const newEvent = await Event.saveEvent(
        _normalize42EventToSaveInDb(event42, CONSTANTS.EVENT_SOURCE_42API),
        CONSTANTS.EVENT_SOURCE_42API,
      );
      console.log(
        `🆕 new event created: ${newEvent.intraId} ${newEvent.title}`,
      );
    } else {
      if (event42.updated_at !== existingEvent.intraUpdatedAt) {
        const updatedEvent = await Event.updateEvent(
          _normalize42EventToSaveInDb(event42, CONSTANTS.EVENT_SOURCE_42API),
        );
        const remindAt = new Date(
          new Date(updatedEvent.beginAt).getTime() -
            1000 * 60 * CONSTANTS.REMINDER_BEFORE_EVENT_MINUTES,
        );
        await updateUserEventsRemindAt(updatedEvent.id, remindAt);
        console.log(
          `🆙 event updated: ${updatedEvent.intraId} ${updatedEvent.title}`,
        );
      }
    }
  });
};

const _syncExams = originalExams => {
  const exams = [
    ...new Map(originalExams.map(exam => [exam.id, exam])).values(),
  ];
  Promise.all(
    exams.map(async exam => {
      const existingExam = await Event.getEventByIntraId(exam.id);
      if (!existingExam) {
        // save new event as exam in db
        const newExam = await Event.saveEvent(
          _normalize42ExamToSaveInDb(exam),
          CONSTANTS.EVENT_SOURCE_42API,
        );
        console.log(
          `🆕 new exam event created: ${newExam.intraId} ${newExam.title}`,
        );
      } else {
        if (exam.updated_at !== existingExam.intraUpdatedAt) {
          // update event as exam in db
          const updatedExam = await Event.updateEvent(
            _normalize42ExamToSaveInDb(exam),
          );
          const remindAt = new Date(
            new Date(updatedExam.beginAt).getTime() -
              1000 * 60 * CONSTANTS.REMINDER_BEFORE_EVENT_MINUTES,
          );
          await updateUserEventsRemindAt(updatedExam.id, remindAt);
          console.log(
            `🆙 exam event updated: ${updatedExam.intraId} ${updatedExam.title}`,
          );
        }
      }
    }),
  );
};

const syncUpComingEventsFrom42 = async () => {
  console.log('syncUpComingEventsFrom42');
  try {
    const eventsFrom42Api = await get42CampusUpComingEvents(SEOUL_CAMPUS_ID);
    if (!eventsFrom42Api) throw new Error('campus events not found');
    _syncEvents(eventsFrom42Api);

    const examsFrom42Api = await get42CampusCadetUpComingExams(SEOUL_CAMPUS_ID);
    if (!examsFrom42Api) throw new Error('campus exams not found');
    _syncExams(examsFrom42Api);
  } catch (err) {
    console.error(err);
  }
};

const syncEveryEventsFrom42 = async () => {
  try {
    const eventsFrom42Api = await get42CampusEveryEvents(SEOUL_CAMPUS_ID);
    if (!eventsFrom42Api) throw new Error('campus events not found');
    _syncEvents(eventsFrom42Api);

    const examsFrom42Api = await get42CampusCadetEveryExams(SEOUL_CAMPUS_ID);
    if (!examsFrom42Api) throw new Error('campus exams not found');
    _syncExams(examsFrom42Api);
  } catch (err) {
    console.error;
  }
};

const SEOUL_CAMPUS_ID = '29';

const syncUserEventsFrom42 = async intraUsername => {
  try {
    console.log('syncUserEventsFrom42');
    const user = await User.getUser(intraUsername);
    const existingUserEvents = await UserEvent.getUserEventsByUserId(user.id);
    const recentestIntraIdOfExistingUserEvent = existingUserEvents.reduce(
      (prev, current) => {
        return prev.intraId > current.intraId ? prev.intraId : current.intraId;
      },
      0,
    );
    const userEventsFrom42Api = await get42UserEvents(intraUsername);

    const recentUserEvents42Api = await get42RecentUserEvents(
      intraUsername,
      recentestIntraIdOfExistingUserEvent + 1,
    );
    if (!recentUserEvents42Api) throw new Error('user events not found');

    // update new subscribed event from api to db
    recentUserEvents42Api.forEach(async userEvent42 => {
      const existingEvent = await Event.findOne({
        where: { intraId: userEvent42.id },
        raw: true,
      });
      if (!existingEvent) {
        const newEvent = await Event.saveEvent(
          _normalize42EventToSaveInDb(
            userEvent42,
            CONSTANTS.EVENT_SOURCE_42API,
          ),
          CONSTANTS.EVENT_SOURCE_42API,
        );
        console.log(
          `🆕 new event created: ${newEvent.intraId} ${newEvent.title}`,
        );
        const newUserEvent = await UserEvent.saveUserEvent(
          user.id,
          newEvent.id,
          {
            isSubscribedOnIntra: true,
            isSetReminder: false,
            remindAt: null,
          },
        );
        console.log(
          `🆕 new user event created: ` +
            `${newUserEvent.intraId} ${newUserEvent.title}`,
        );
      } else {
        const existingUserEvent = await UserEvent.findOne({
          where: {
            userId: user.id,
            eventId: existingEvent.id,
          },
        });
        if (!existingUserEvent) {
          const newUserEvent = await UserEvent.saveUserEvent(
            user.id,
            existingEvent.id,
            {
              isSubscribedOnIntra: true,
              isSetReminder: false,
              remindAt: null,
            },
          );
          console.log('🆕 new user event created: ', newUserEvent.title);
        }
      }
    });

    // remove cancel subscribe event from api to db
    existingUserEvents.forEach(async userEvent => {
      const isExistIn42 = userEventsFrom42Api.find(
        userEventFrom42Api => userEventFrom42Api.id === userEvent.intraId,
      );
      if (isExistIn42) return;
      await UserEvent.deleteUserEvent(user.id, userEvent.id);
      console.log(
        `🗑 user event deleted: ` + `${userEvent.intraId} ${userEvent.title}`,
      );
    });
  } catch (err) {
    console.error(err);
  }
};

module.exports = {
  normalizeEventToResponse,
  updateUserEventsRemindAt,
  syncUpComingEventsFrom42,
  syncEveryEventsFrom42,
};
