// sequelize-cli configuration. Reads every credential from the environment.
require('dotenv').config();

function buildConfig() {
  return {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: process.env.DB_DIALECT || 'postgres',
    logging: false,
    define: { underscored: true },
  };
}

module.exports = {
  development: buildConfig(),
  test: {
    ...buildConfig(),
    database: process.env.DB_NAME_TEST || `${process.env.DB_NAME}_test`,
  },
  production: buildConfig(),
};
