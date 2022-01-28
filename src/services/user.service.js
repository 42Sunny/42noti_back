const { User } = require('../models');
const { get42User } = require('../utils/42api');

module.exports = {
  getMyUserData: async intraUsername => {
    try {
      const user = await User.getUser(intraUsername);
      if (!user) {
        throw new Error('user not found');
      }
      return user;
    } catch (err) {
      console.error(err);
    }
  },
  getUser: async intraUsername => {
    const user = await User.getUser(intraUsername);
    if (!user) {
      const userFromApi = await get42User(intraUsername);
      if (!userFromApi) {
        return null;
      }
      const { id, login, displayname, email, url } = userFromApi;
      const data = {
        id,
        username: login,
        displayName: displayname,
        email,
        intraProfilePageUrl: url,
      };
      return data;
    }
    const { id, intraId, displayName, email, intraProfilePageUrl, role } =
      user;
    const data = {
      id,
      intraId,
      username: intraUsername,
      displayName,
      email,
      intraProfilePageUrl,
      role,
    };
    return data;
  },
};
