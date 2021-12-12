const expressLoader = require('./express');
const sequelizeLoader = require('./sequelize');

module.exports = async (app) => {
  await expressLoader(app);
  console.log('Express Intialized');
//  await sequelizeLoader();
//  console.log('Sequelize Intialized');
};
