const crypto = require('crypto');
const mongoose = require('mongoose');

const AppSettings = require('../models/AppSettings');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function getOrCreateSettings() {
  let settings = await AppSettings.findOne({ singletonKey: 'default' });
  if (!settings) {
    settings = await AppSettings.create({ singletonKey: 'default' });
  }
  return settings;
}

function sanitizeSettings(settings) {
  return {
    branding: settings.branding,
    preferences: settings.preferences,
    supportEmail: settings.supportEmail,
    initializedAt: settings.initializedAt,
    isBootstrapped: Boolean(settings.adminTokenHash),
    updatedAt: settings.updatedAt,
  };
}

function sanitizePublicSettings(settings) {
  return {
    branding: {
      logoUrl: settings.branding?.logoUrl || '',
      companyName: settings.branding?.companyName || 'SimpleAnonymousScheduler',
      templateText: settings.branding?.templateText || 'Welcome to SimpleAnonymousScheduler',
    },
    preferences: {
      dateFormat: settings.preferences?.dateFormat || 'MM/dd/yyyy',
      timezone: settings.preferences?.timezone || 'UTC',
    },
    supportEmail: settings.supportEmail || '',
  };
}

function getAdminToken(req) {
  return req.header('x-admin-token') || '';
}

function isAdminAuthorized(req, settings) {
  const adminToken = getAdminToken(req);

  if (settings.adminTokenHash) {
    return Boolean(adminToken) && hashToken(adminToken) === settings.adminTokenHash;
  }

  return Boolean(process.env.ADMIN_SETUP_TOKEN) && adminToken === process.env.ADMIN_SETUP_TOKEN;
}

exports.health = async (_req, res) => {
  try {
    const settings = await getOrCreateSettings();

    const mongoStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    return res.json({
      app: 'SimpleAnonymousScheduler',
      status: 'ok',
      serverTime: new Date().toISOString(),
      mongo: mongoStates[mongoose.connection.readyState] || 'unknown',
      config: {
        hasMongoUri: Boolean(process.env.MONGO_URI),
        hasJwtSecret: Boolean(process.env.JWT_SECRET),
        hasEmailConfig: Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS),
        hasGoogleOAuthConfig: Boolean(
          process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI
        ),
        frontendUrl: process.env.FRONTEND_URL || '',
      },
      settings: {
        isBootstrapped: Boolean(settings.adminTokenHash),
        initializedAt: settings.initializedAt || null,
      },
    });
  } catch (err) {
    return res.status(500).json({ msg: 'Health check failed', error: err.message });
  }
};

exports.getPublicSettings = async (_req, res) => {
  try {
    const settings = await getOrCreateSettings();
    return res.json(sanitizePublicSettings(settings));
  } catch (err) {
    return res.status(500).json({ msg: 'Failed to fetch public settings', error: err.message });
  }
};

exports.bootstrap = async (req, res) => {
  try {
    const setupToken = req.header('x-setup-token');
    if (!process.env.ADMIN_SETUP_TOKEN) {
      return res.status(400).json({ msg: 'ADMIN_SETUP_TOKEN is not configured on the server' });
    }

    if (setupToken !== process.env.ADMIN_SETUP_TOKEN) {
      return res.status(401).json({ msg: 'Invalid setup token' });
    }

    const settings = await getOrCreateSettings();
    if (settings.adminTokenHash) {
      return res.status(400).json({ msg: 'Admin bootstrap already completed' });
    }

    const suppliedAdminToken = req.body.adminToken;
    const adminToken = suppliedAdminToken || crypto.randomBytes(24).toString('hex');

    settings.adminTokenHash = hashToken(adminToken);
    settings.initializedAt = new Date();
    await settings.save();

    return res.json({
      msg: 'Bootstrap complete. Store this admin token securely.',
      adminToken,
      settings: sanitizeSettings(settings),
    });
  } catch (err) {
    return res.status(500).json({ msg: 'Bootstrap failed', error: err.message });
  }
};

exports.getSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    if (!isAdminAuthorized(req, settings)) {
      return res.status(401).json({ msg: 'Invalid admin token' });
    }

    return res.json(sanitizeSettings(settings));
  } catch (err) {
    return res.status(500).json({ msg: 'Failed to fetch settings', error: err.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    if (!isAdminAuthorized(req, settings)) {
      return res.status(401).json({ msg: 'Invalid admin token' });
    }

    const { logoUrl, companyName, templateText, dateFormat, timezone, supportEmail } = req.body;

    if (typeof logoUrl === 'string') {
      settings.branding.logoUrl = logoUrl;
    }
    if (typeof companyName === 'string') {
      settings.branding.companyName = companyName;
    }
    if (typeof templateText === 'string') {
      settings.branding.templateText = templateText;
    }
    if (typeof dateFormat === 'string') {
      settings.preferences.dateFormat = dateFormat;
    }
    if (typeof timezone === 'string') {
      settings.preferences.timezone = timezone;
    }
    if (typeof supportEmail === 'string') {
      settings.supportEmail = supportEmail;
    }

    await settings.save();

    return res.json({ msg: 'Settings updated', settings: sanitizeSettings(settings) });
  } catch (err) {
    return res.status(500).json({ msg: 'Failed to update settings', error: err.message });
  }
};
