const expressLoader = require('./express');
const sequelizeLoader = require('./sequelize');
const initLoader = require('./init');

module.exports = async (app) => {
  await expressLoader(app);
  console.log('Express Intialized');
  await sequelizeLoader();
  console.log('Sequelize Intialized');
  await initLoader();
  console.log('Init Intialized');
};
