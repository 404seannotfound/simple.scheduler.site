const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verificationToken: DataTypes.STRING,
  googleAccessToken: DataTypes.TEXT,
  googleRefreshToken: DataTypes.TEXT,
  shareAvailability: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  availabilityWindows: {
    type: DataTypes.JSONB,
    defaultValue: []
  }
}, {
  timestamps: true,
  tableName: 'users'
});

module.exports = User;
