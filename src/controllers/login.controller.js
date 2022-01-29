const httpStatus = require('http-status');
const env = require('../config');
const loginService = require('../services/login.service');

const loginReturnController = async (req, res) => {
  try {
    // TODO: logger
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
    console.error(err);
  }
};

const logoutController = async (req, res) => {
  try {
    res.clearCookie(env.cookie.auth);
    res.redirect(env.frontUrl);
  } catch (err) {
    console.error(err);
  }
}

module.exports = {
  loginReturnController,
  logoutController,
};
