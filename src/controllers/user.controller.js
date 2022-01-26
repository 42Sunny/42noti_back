const httpStatus = require('http-status');
const { getUser } = require('../services/user.service');

module.exports = {
  apiUserDataController: async (req, res) => {
    const { intraUsername } = req.params;
    try {
      const data = await getUser(intraUsername);
      if (!data) {
        res.status(httpStatus.NOT_FOUND).json({
          message: 'user not found',
        });
      }
      res.json(data);
    } catch (err) {
      console.error(err);
    }
  },
  apiMyUserDataController: async (req, res) => {
    const intraUsername = req.user.jwt.name;

    try {
      const data = await getUser(intraUsername);
      if (!data) {
        res.status(httpStatus.NOT_FOUND).json({
          message: 'user not found',
        });
      }
      res.json(data);
    } catch (err) {
      console.error(err);
    }
  },
};
