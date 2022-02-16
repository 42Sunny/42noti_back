const httpStatus = require('http-status');
const { getUser, getCadet, getMyUserData } = require('../services/user.service');
const logger = require('../utils/winston');

const userDataController = async (req, res) => {
  const { intraUsername } = req.params;
  try {
    const data = await getUser(intraUsername);
    if (!data) {
      const cadet = await getCadet(intraUsername);
      if (!cadet) {
        res.status(httpStatus.NOT_FOUND).json({
          message: 'cadet not found',
        });
      }
      res.status(httpStatus.NOT_FOUND).json({
        message: 'user not found',
        cadet: cadet,
      });
    }
    res.json(data);
  } catch (err) {
    logger.error(err);
  }
};

const myUserDataController = async (req, res) => {
  const intraUsername = req.user.jwt.name;

  try {
    const data = await getMyUserData(intraUsername);
    if (!data) {
      res.status(httpStatus.NOT_FOUND).json({
        message: 'user not found',
      });
    }
    res.json(data);
  } catch (err) {
    logger.error(err);
  }
};

module.exports = {
  userDataController,
  myUserDataController,
};
