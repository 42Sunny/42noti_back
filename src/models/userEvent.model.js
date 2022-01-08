const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = class UserEvent extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          allowNull: false,
          primaryKey: true,
        },
        remindAt: {
          type: DataTypes.DATE,
        },
        isSetReminder: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
        isSubscribedOnIntra: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
      },
      {
        sequelize,
        timestamps: true,
      },
    );
  }

  static associate(db) {}
};
