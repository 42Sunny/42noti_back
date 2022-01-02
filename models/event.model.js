const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = class Event extends Model {
  static init(sequelize) {
    return super.init(
      {
        intraId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        intraCreatedAt: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        intraUpdatedAt: {
          type: DataTypes.STRING,
          allowNull: false,
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
          allowNull: false,
        },
      },
      {
        sequelize,
        timestamps: true,
      },
    );
  }

  static associate(db) {
    db.Event.belongsToMany(db.User, { as: 'User', through: 'UserEvent' });
  }
};
