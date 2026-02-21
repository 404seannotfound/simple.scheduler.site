const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Meeting = sequelize.define('Meeting', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  creatorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  attendeeIds: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: []
  },
  proposedTimes: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  approvals: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  messages: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  confirmedTime: DataTypes.DATE,
  googleMeetLink: DataTypes.STRING,
  calendarEventId: DataTypes.STRING
}, {
  timestamps: true,
  tableName: 'meetings'
});

module.exports = Meeting;
