const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = class User extends Model {
  static init(sequelize) {
    return super.init(
      {
        intra_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        intra_login: {
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
        access_token: {
          type: DataTypes.STRING,
        },
        refresh_token: {
          type: DataTypes.STRING,
        },
        token_expiry_date: {
          type: DataTypes.DATE,
        },
      },
      {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        timestamps: true,
        paranoid: true,
      },
    );
  }

  static associate(db) {}
};
