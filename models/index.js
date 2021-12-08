const { Sequelize } = require('sequelize');
const env = require('../config');

const sequelize = new Sequelize(
  env.databaseName,
  env.databaseUsername,
  env.databasePassword,
  {
    host: env.databaseHost,
    dialect: 'mysql',
    port: env.databasePort,
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
      freezeTableName: true,
    },
    timezone: '+09:00',
  },
);

module.exports = sequelize;
