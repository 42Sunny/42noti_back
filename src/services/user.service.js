const { User } = require('../models');
const { get42User } = require('../utils/42api');

const getMyUserData = async intraUsername => {
  try {
    const user = await User.getUser(intraUsername);
    if (!user) {
      throw new Error('user not found');
    }
    return user;
  } catch (err) {
    console.error(err);
  }
};

const getCadet = async intraUsername => {
  const cadetFrom42 = await get42User(intraUsername);
  if (!cadetFrom42) {
    return null;
  }
  const { id, login, displayname, email, url } = cadetFrom42;
  const data = {
    id: null,
    intraId: id,
    username: login,
    displayName: displayname,
    email,
    intraProfilePageUrl: url,
    role: null,
  };
  return data;
};

const getUser = async intraUsername => {
  const user = await User.getUser(intraUsername);
  if (!user) {
    return null;
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
};

module.exports = {
  getMyUserData,
  getCadet,
  getUser,
};
