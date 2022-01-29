const jwt = require('jsonwebtoken');
const context = require('express-http-context');
const env = require('../config');
const { User } = require('../models');

const _getUserData = async user => {
  const foundedUser = await User.findOne({
    where: { intraId: user.intraId },
  });

  if (!foundedUser) {
    const newUser = await User.create({
      intraId: user.intraId,
      intraUsername: user.intraUsername,
      intraProfilePageUrl: user.intraProfilePageUrl,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
    });
    // TODO: logeer - user created
    return newUser;
  }

  if (foundedUser.email !== user.email) {
    foundedUser.email = user.email;
    await foundedUser.save();
  }
  return foundedUser;
};

const _generateToken = user => {
  try {
    const payload = {
      username: user.intraUsername,
      sub: user.intraId,
    };
    context.set('login', user?.intraUsername);
    const token = jwt.sign(payload, env.cookie.secret, { expiresIn: '7d' });
    // TODO: logger
    return token;
  } catch (err) {
    console.error(err);
    // TODO: logger
    throw err;
  }
};

const getToken = async user => {
  if (!user) {
    console.error('no user data:', user);
    // TODO error handler
  }
  const userData = await _getUserData(user);
  const token = await _generateToken(userData);
  const decodedToken = jwt.decode(token);
  const cookieOption = {
    domain: env.cookie.domain,
    expires: new Date(decodedToken.exp * 1000),
  };
  return { token, cookieOption };
};

module.exports = {
  getToken,
};
