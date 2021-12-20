const httpStatus = require('http-status');
const env = require('../config');
const loginService = require('../services/login');

module.exports = {
  loginController: async (req, res) => {

  },
  loginReturnController: async (req, res) => {
    try {
      // TODO: logger
      const { token, cookieOption } = await loginService.getToken(
        req.user?.meetupData,
      );
      console.log('loginReturnController req: ', req);
      console.log('loginReturnController session: ', req.session);
      res.cookie(env.cookieAuth, token, cookieOption);
      console.log('env.cookieAuth', env.cookieAuth);
      console.log('token', token);
      console.log('cookieOption', cookieOption);
      res.status(httpStatus.FOUND).redirect(`https://${env.front.host}:${env.front.port}`);
    } catch (err) {
      // TODO: error handler
      console.error(err);
    }
  },
};
