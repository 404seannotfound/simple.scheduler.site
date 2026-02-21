const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost:5432/scheduler', {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Postgres connected');
  } catch (err) {
    console.error('✗ Postgres connection error:', err.message);
    process.exit(1);
  }
};

module.exports = { sequelize, testConnection };
