const { DataTypes, Model } = require('sequelize');

module.exports = class UserEvent extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
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

  static associate(db) {
    this.belongsTo(db.User, { foreignKey: 'UserId', as: 'User' });
    this.belongsTo(db.Event, { foreignKey: 'EventId', as: 'Event' });
  }

  static async getUserEvent(userId, eventId) {
    const userEvent = await this.findOne({
      where: {
        UserId: userId,
        EventId: eventId,
      },
    });
    if (!userEvent) {
      return null;
    }
    return userEvent;
  }

  static async saveUserEvent(userId, eventId, data) {
    const { isSubscribedOnIntra, isSetReminder, remindAt } = data;

    const userEvent = await this.findOne({
      where: {
        UserId: userId,
        EventId: eventId,
      },
      raw: true,
    });
    if (userEvent) {
      return userEvent;
    }

    const now = new Date();
    const newUserEvent = await this.create({
      UserId: userId,
      EventId: eventId,
      isSubscribedOnIntra,
      isSetReminder,
      remindAt: remindAt > now ? remindAt : now,
    });
    return newUserEvent;
  }

  static async updateUserEvent(userId, eventId, data) {
    const { isSubscribedOnIntra, isSetReminder, remindAt } = data;

    const userEvent = await this.findOne({
      where: {
        UserId: userId,
        EventId: eventId,
      },
    });

    if (isSubscribedOnIntra)
      userEvent.isSubscribedOnIntra = isSubscribedOnIntra;
    if (isSetReminder)
      userEvent.isSetReminder = isSetReminder;
    if (remindAt)
      userEvent.remindAt = remindAt;
    await userEvent.save();
    return userEvent;
  }

  static async deleteUserEvent(userId, eventId) {
    try {
      const userEvent = await this.findOne({
        where: {
          UserId: userId,
          EventId: eventId,
        },
        raw: true,
      });
      if (!userEvent) {
        throw new Error('userEvent not found');
      }
      await userEvent.destroy();
      return userEvent;
    } catch (err) {
      console.error(err);
    }
  }

  static async getUserEventsByUserId(userId) {
    const userEvents = await this.findAll({
      where: { UserId: userId, isSetReminder: true },
      raw: true,
    });
    if (userEvents.length === 0) {
      return null;
    }
    return userEvents;
  }

  static async getUserEventsByEventId(eventId) {
    const userEvents = await this.findAll({
      where: { EventId: eventId, isSetReminder: true },
      raw: true,
    });
    if (userEvents.length === 0) {
      return null;
    }
    return userEvents;
  }
};
