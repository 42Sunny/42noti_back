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
      const userFrom42 = await get42User(intraUsername);
      if (!userFrom42) {
        return null;
      }
      const { id, login, displayname, email, url } = userFrom42;
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
