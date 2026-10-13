import 'dotenv/config';
import { Sequelize, Dialect } from 'sequelize';

const dialect = (process.env.DB_DIALECT || 'postgres') as Dialect;

export const sequelize = new Sequelize({
  dialect,
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 60000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
  },
  retry: {
    max: 3,
  },
});

let dbConnected = false;

export const connectDB = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL Connected Successfully');
    dbConnected = true;
  } catch (error) {
    const err = error as Error;
    console.error('=== PostgreSQL Connection Error ===');
    console.error('Error Message:', err.message);
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    } else {
      console.error('Continuing without database (production mode)');
    }
  }
};

export const isDBConnected = (): boolean => dbConnected;
