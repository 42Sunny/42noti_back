const { Sequelize } = require('sequelize');
const env = require('../config');
const Event = require('./event.model');
const User = require('./user.model');
const UserEvent = require('./userEvent.model');

const db = {};
const sequelize = new Sequelize(
  env.db.name,
  env.db.username,
  env.db.password,
  {
    host: env.db.host,
    dialect: 'mysql',
    port: env.db.port,
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
      freezeTableName: true,
    },
    timezone: '+09:00',
  },
);

db.sequelize = sequelize;
db.Event = Event;
db.User = User;
db.UserEvent = UserEvent;

Event.init(sequelize);
User.init(sequelize);
UserEvent.init(sequelize);

Event.associate(db);
User.associate(db);
UserEvent.associate(db);

module.exports = db;
