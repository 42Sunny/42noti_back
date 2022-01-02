const { getUserInDb } = require('../utils/user');
const { get42User } = require('../utils/42api');

module.exports = {
  getUser: async intraUsername => {
    const user = await getUserInDb(intraUsername);
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
    const { intraId, displayName, email, intraProfilePageUrl } =
      user;
    const data = {
      id: intraId,
      username: intraUsername,
      displayName,
      email,
      intraProfilePageUrl,
    };
    return data;
  },
};
