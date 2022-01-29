const axios = require('axios');
const { get42CachedToken } = require('./42auth');

const END_POINT_42_API = 'https://api.intra.42.fr';

const _get42ApiWithToken = async path => {
  try {
    const { access_token, token_type } = await get42CachedToken();
    console.log(`${token_type} ${access_token}`);
    const response = await axios(`${END_POINT_42_API}${path}`, {
      method: 'GET',
      headers: {
        Authorization: `${token_type} ${access_token}`,
      },
    });
    if (response.status === 200) {
      return response.data;
    } else {
      return null;
    }
  } catch (err) {
    console.error(err);
  }
};

const get42Api = async path => {
  try {
    const data = await _get42ApiWithToken(path);
    if (data) {
      return data;
    }
  } catch (err) {
    console.error(err);
  }
};

const get42Campus = async () => {
  const path = `/v2/campus`;
  try {
    const data = await _get42ApiWithToken(path);
    if (data) {
      return data;
    }
  } catch (err) {
    console.error(err);
  }
};

const get42User = async id => {
  const path = `/v2/users/${id}`;
  try {
    const data = await _get42ApiWithToken(path);
    if (data) {
      return data;
    }
  } catch (err) {
    console.error(err);
  }
};

const get42CampusUpComingEvents = async campusId => {
  // const path = `/v2/campus/${campusId}/events?filter[future]=true`;
  const now = new Date();
  const future = new Date('9999-12-31T00:00:00.000Z');
  const path =
    `/v2/campus/${campusId}/events` +
    `?range[end_at]=${now.toISOString()},${future.toISOString()}`;
  try {
    const data = await _get42ApiWithToken(path);
    if (data) {
      return data;
    }
  } catch (err) {
    console.error(err);
  }
};

const get42CampusRecentThirtyEvents = async campusId => {
  const path =
    `/v2/campus/${campusId}/events` + `?page[size]=30&sort=-begin_at,-id`; // recent 30 events
  try {
    const data = await _get42ApiWithToken(path);
    if (data) {
      return data;
    }
  } catch (err) {
    console.error(err);
  }
};

const get42CampusEveryEvents = async campusId => {
  const size = 100;
  const path = `/v2/campus/${campusId}/events` + `?page[size]=${size}`;
  try {
    const result = [];
    let page = 1;
    let data = await _get42ApiWithToken(path + `&page[number]=${page}`);
    while (data && data.length > 0) {
      result.push(...data);
      page++;
      data = await _get42ApiWithToken(path + `&page[number]=${page}`);
    }
    return result;
  } catch (err) {
    console.error(err);
  }
};

const get42Event = async eventId => {
  const path = `/v2/events/${eventId}`;
  try {
    const data = await _get42ApiWithToken(path);
    if (data) {
      return data;
    }
  } catch (err) {
    console.error(err);
  }
};

const get42CampusCadetExams = async campusId => {
  const CARDET_CURSUS_ID = '21';
  const path = `/v2/campus/${campusId}/cursus/${CARDET_CURSUS_ID}/exams`;
  try {
    const data = await _get42ApiWithToken(path);
    if (data) {
      return data;
    }
  } catch (err) {
    console.error(err);
  }
};

const get42CampusCadetUpComingExams = async campusId => {
  const CARDET_CURSUS_ID = '21';
  const now = new Date();
  const future = new Date('9999-12-31T00:00:00.000Z');
  const path =
    `/v2/campus/${campusId}/cursus/${CARDET_CURSUS_ID}/exams` +
    `?range[end_at]=${now.toISOString()},${future.toISOString()}`;
  try {
    const data = await _get42ApiWithToken(path);
    if (data) {
      return data;
    }
  } catch (err) {
    console.error(err);
  }
};

const get42CampusCadetEveryExams = async campusId => {
  const CARDET_CURSUS_ID = '21';
  const size = 100;
  const path =
    `/v2/campus/${campusId}/cursus/${CARDET_CURSUS_ID}/exams` +
    `?page[size]=${size}`;
  try {
    const result = [];
    let page = 1;
    let data = await _get42ApiWithToken(path + `&page[number]=${page}`);
    while (data && data.length > 0) {
      result.push(...data);
      page++;
      data = await _get42ApiWithToken(path + `&page[number]=${page}`);
    }
    return result;
  } catch (err) {
    console.error(err);
  }
};

const get42UserEvents = async userId => {
  const path = `/v2/users/${userId}/events`;
  try {
    const data = await _get42ApiWithToken(path);
    if (data) {
      return data;
    }
  } catch (err) {
    console.error(err);
  }
};

const get42RecentUserEvents = async (userId, recentEventId) => {
  // get user events from `recentEventId` to now
  const path =
    `/v2/users/${userId}/events` +
    `?sort=-id&range[id]=${recentEventId},99999999`;
  try {
    const data = await _get42ApiWithToken(path);
    if (data) {
      return data;
    }
  } catch (err) {
    console.error(err);
  }
};

module.exports = {
  get42Api,
  get42Campus,
  get42User,
  get42CampusUpComingEvents,
  get42CampusRecentThirtyEvents,
  get42CampusEveryEvents,
  get42Event,
  get42CampusCadetExams,
  get42CampusCadetUpComingExams,
  get42CampusCadetEveryExams,
  get42UserEvents,
  get42RecentUserEvents,
};
