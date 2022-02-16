const { DataTypes, Model } = require('sequelize');
const logger = require('../utils/winston');

module.exports = class User extends Model {
  static init(sequelize) {
    return super.init(
      {
        intraId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        intraUsername: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        intraProfilePageUrl: {
          type: DataTypes.STRING,
        },
        displayName: {
          type: DataTypes.STRING,
        },
        email: {
          type: DataTypes.STRING,
        },
        role: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        accessToken: {
          type: DataTypes.STRING,
        },
        refreshToken: {
          type: DataTypes.STRING,
        },
      },
      {
        sequelize,
        timestamps: true,
        paranoid: true,
      },
    );
  }

  static associate(db) {
    db.User.belongsToMany(db.Event, { as: 'Event', through: 'UserEvent' });
  }

  static async getUser(intraUsername) {
    try {
      const user = await this.findOne({
        where: { intraUsername },
        raw: true,
      });
      return user;
    } catch (err) {
      logger.error(err);
    }
  }
};
