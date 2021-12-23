const { Sequelize } = require('sequelize');
const env = require('../config');
const Event = require('./event');
const User = require('./user');

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

Event.init(sequelize);
User.init(sequelize);

Event.associate(db);
User.associate(db);

Event.belongsToMany(User, { through: 'EventUser' });
User.belongsToMany(Event, { through: 'EventUser' });

module.exports = db;
