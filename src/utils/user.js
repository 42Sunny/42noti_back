const User = require('../models/user.model');

module.exports = {
  getUserInDb: async intraUsername => {
    try {
      const user = await User.findOne({
        where: { intraUsername: intraUsername },
        raw: true,
      });
      return user;
    } catch (err) {
      console.error(err);
    }
  },
  saveUserInDb: async user => {
    try {
      const foundUser = await User.findOne({
        where: { intraUsername: user.intraUsername },
        raw: true,
      });
      if (foundUser) {
        return foundUser;
      }
      const newUser = await User.create(user);
      return newUser;
    } catch (err) {
      console.error(err);
    }
  }
};
