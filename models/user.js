const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = class User extends Model {
  static init(sequelize) {
    return super.init(
      {
        intraDataId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        intraDataLogin: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        email: {
          type: DataTypes.STRING,
        },
        profile: {
          type: DataTypes.JSON,
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
        tokenExpiryDate: {
          type: DataTypes.DATE,
        },
      },
      {
        sequelize,
        timestamps: true,
        paranoid: true,
      },
    );
  }

  static associate(db) {}
};
