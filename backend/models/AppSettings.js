const mongoose = require('mongoose');

const appSettingsSchema = new mongoose.Schema(
  {
    singletonKey: { type: String, default: 'default', unique: true },
    branding: {
      logoUrl: { type: String, default: '' },
      companyName: { type: String, default: 'SimpleAnonymousScheduler' },
      templateText: { type: String, default: 'Welcome to SimpleAnonymousScheduler' },
    },
    preferences: {
      dateFormat: { type: String, default: 'MM/dd/yyyy' },
      timezone: { type: String, default: 'UTC' },
    },
    supportEmail: { type: String, default: '' },
    adminTokenHash: { type: String, default: '' },
    initializedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AppSettings', appSettingsSchema);
