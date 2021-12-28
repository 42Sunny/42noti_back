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
        setReminder: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
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
