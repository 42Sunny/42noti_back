const httpStatus = require('http-status');
const env = require('../config');
const loginService = require('../services/login.service');
const logger = require('../utils/winston');

const loginReturnController = async (req, res) => {
  try {
    logger.info(`login: ${req.user?.ft}`)
    const { token, cookieOption } = await loginService.getToken(
      req.user?.ft,
    );
    res.cookie(env.cookie.auth, token, cookieOption);
    res
      .status(httpStatus.FOUND)
      .redirect(
        env.frontUrl,
      );
  } catch (err) {
    // TODO: error handler
    logger.error(err);
  }
};

const logoutController = async (req, res) => {
  try {
    res.clearCookie(env.cookie.auth);
    res.redirect(env.frontUrl);
  } catch (err) {
    logger.error(err);
  }
}

module.exports = {
  loginReturnController,
  logoutController,
};
