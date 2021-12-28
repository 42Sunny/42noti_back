const { get42User } = require('../utils/42api');

module.exports = {
  getUser: async intraLoginId => {
    const originalData = await get42User(intraLoginId);
    if (!originalData) {
      return null;
    }
    const { id, email, login, displayname, url } = originalData;
    const data = {
      intraId: id,
      email,
      intraLogin: login,
      displayName: displayname,
      intraProfilePageUrl: url,
    };
    return data;
  },
};
