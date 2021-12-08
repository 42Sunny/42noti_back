const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = class Event extends Model {
  static init(sequelize) {
    return super.init(
      {
        intra_id: {
          type: DataTypes.INTEGER,
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
        max_subscribers: {
          type: DataTypes.INTEGER,
        },
        current_subscribers: {
          type: DataTypes.INTEGER,
        },
        begin_at: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        end_at: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        category: {
          type: DataTypes.STRING,
          allowNull: false,
          // category_domain
        },
        tags: {
          type: DataTypes.STRING,
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: 'Event',
        tableName: 'events',
        timestamps: true,
      },
    );
  }

  static associate(db) {}
};
