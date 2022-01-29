const { DataTypes, Model } = require('sequelize');
const CONSTANTS = require('../utils/constants');

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

  static async getEvent(eventId) {
    console.log('getEvent', eventId);
    try {
      const event = await this.findOne({
        where: { id: eventId },
        raw: true,
      });
      if (!event) {
        throw new Error('event not found');
      }
      console.log('event', event);
      return event;
    } catch (err) {
      console.error(err);
    }
  }

  static async getEventByIntraId(intraId) {
    try {
      const event = await this.findOne({
        where: { intraId },
        raw: true,
      });
      if (!event) {
        throw new Error('event not found');
      }
      return event;
    } catch (err) {
      console.error(err);
    }
  }

  static async saveEvent(event, source) {
    if (source === CONSTANTS.EVENT_SOURCE_42API) {
      const where = event.id ? { id: event.id } : { intraId: event.intraId };
      const existingEvent = await this.findOne({
        where,
        raw: true,
      });
      if (existingEvent) {
        return existingEvent;
      }
    }
    const newEvent = await this.create({
      ...event,
      source,
    });
    return newEvent;
  }

  static async updateEvent(data, eventId = null) {
    let where;
    if (eventId)
      where = { id: eventId };
    else if (data.id)
      where = { id: data.id };
    else
      where = { intraId: data.intraId };

    try {
      const event = await this.findOne({
        where,
      });
      if (!event) {
        throw new Error('event not found');
      }
      const updatedEvent = await event.update(data);
      return updatedEvent.dataValues;
    } catch (err) {
      console.error(err);
    }
  }

  static async deleteEvent(eventId) {
    try {
      const event = await this.findOne({
        where: { id: eventId },
        raw: true,
      });
      if (!event) {
        throw new Error('event not found');
      }
      const deletedEvent = await this.destroy({
        where: { id: eventId },
        raw: true,
      });
      return deletedEvent;
    } catch (err) {
      console.error(err);
    }
  }

  static async getEvents(where) {
    const { beginAt, source, offset, limit } = where;

    const events = await this.findAll({
      where: { source, beginAt },
      order: [['beginAt', 'DESC']],
      offset,
      limit: limit === -1 ? null : limit,
      raw: true,
    });
    if (events.length === 0) {
      return null;
    }
    return events;
  }
};
