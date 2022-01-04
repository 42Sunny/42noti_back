const axios = require('axios');
const { get42TokenCache } = require('./42auth');

const END_POINT_42_API = 'https://api.intra.42.fr';

const get42ApiWithToken = async path => {
  try {
    const { access_token, token_type } = await get42TokenCache();
    console.log(`${token_type} ${access_token}`);
    const response = await axios(`${END_POINT_42_API}/${path}`, {
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

module.exports = {
  get42Api: async path => {
    try {
      const data = await get42ApiWithToken(path);
      if (data) {
        return data;
      }
    } catch (err) {
      console.error(err);
    }
  },
  get42Campus: async () => {
    const path = `/v2/campus`;
    try {
      const data = await get42ApiWithToken(path);
      if (data) {
        return data;
      }
    } catch (err) {
      console.error(err);
    }
  },
  get42User: async id => {
    const path = `/v2/users/${id}`;
    try {
      const data = await get42ApiWithToken(path);
      if (data) {
        return data;
      }
    } catch (err) {
      console.error(err);
    }
  },
  get42CampusEvents: async campusId => {
    const path = `/v2/campus/${campusId}/events?filter[future]=true`;
    try {
      const data = await get42ApiWithToken(path);
      if (data) {
        return data;
      }
    } catch (err) {
      console.error(err);
    }
  },
  get42CampusNewestEvents: async campusId => {
    const path = `/v2/campus/${campusId}/events?sort=-id&page[size]=1`;
    try {
      const data = await get42ApiWithToken(path);
      if (data) {
        return data;
      }
    } catch (err) {
      console.error(err);
    }
  },
  get42Event: async eventId => {
    const path = `/v2/events/${eventId}`;
    try {
      const data = await get42ApiWithToken(path);
      if (data) {
        return data;
      }
    } catch (err) {
      console.error(err);
    }
  },
  get42UserEvents: async userId => {
    const path = `/v2/users/${userId}/events`;
    try {
      const data = await get42ApiWithToken(path);
      if (data) {
        return data;
      }
    } catch (err) {
      console.error(err);
    }
  },
};
