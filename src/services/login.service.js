const jwt = require('jsonwebtoken');
const context = require('express-http-context');
const env = require('../config');
const { User } = require('../models');
const logger = require('../utils/winston');

const _getUserData = async user => {
  const existingUser = await User.findOne({
    where: { intraId: user.intraId },
  });

  if (!existingUser) {
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
    logger.info(`user created: ${newUser}`);
    return newUser;
  }

  if (existingUser.email !== user.email) {
    existingUser.email = user.email;
    await existingUser.save();
  }
  return existingUser.dataValues;
};

const _generateToken = user => {
  try {
    const payload = {
      sub: user.id,
      username: user.intraUsername,
      role: user.role,
    };
    context.set('login', user?.intraUsername);
    const token = jwt.sign(payload, env.cookie.secret, { expiresIn: '7d' });
    logger.info(`token generated: ${token}, payload: ${payload}`);
    return token;
  } catch (err) {
    logger.error(err);
    throw err;
  }
};

const getToken = async user => {
  if (!user) {
    logger.error('no user data:', user);
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
