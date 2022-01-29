const httpStatus = require('http-status');
const { getUser, getMyUserData } = require('../services/user.service');

const userDataController = async (req, res) => {
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
    console.error(err);
  }
};
module.exports = {
  userDataController,
  myUserDataController,
};
