const { sequelize } = require('../models');
const logger = require('../utils/winston');

module.exports = async () => {
  try {
    await sequelize.authenticate();
    console.log('\t Test connection has been established successfully.');
    /*
     * - 'force: true': will drop the table if it already exists
     * - 'alter: true': will set the field if it changed.
     */
    await sequelize.sync({ force: false, alter: false });
    logger.info('sequelize: connection has been established successfully.');
  } catch (error) {
    logger.error('Unable to connect to the database.');
    logger.error(error);
  }
};
