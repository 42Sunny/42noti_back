const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = class Event extends Model {
  static init(sequelize) {
    return super.init(
      {
        intraId: {
          type: DataTypes.INTEGER,
        },
        intraCreatedAt: {
          type: DataTypes.STRING,
        },
        intraUpdatedAt: {
          type: DataTypes.STRING,
        },
        title: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        location: {
          type: DataTypes.STRING,
        },
        maxSubscribers: {
          type: DataTypes.INTEGER,
        },
        currentSubscribers: {
          type: DataTypes.INTEGER,
        },
        beginAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        endAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        category: {
          type: DataTypes.STRING,
          allowNull: false,
          // category_domain
        },
        tags: {
          type: DataTypes.TEXT,
        },
        source: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '42api-1, admin-2, cadet-3, mock-4',
          /*
           * 1. 42api: from 42 api
           * 2. admin: from 42Event admin
           * 3. cadet: for meetup from 42Event frontend
           * 4. mock: mock event for test
           */
        },
        // TODO: add createdBy
      },
      {
        sequelize,
        timestamps: true,
        paranoid: true,
      },
    );
  }

  static associate(db) {
    db.Event.belongsToMany(db.User, { as: 'User', through: 'UserEvent' });
  }
};
