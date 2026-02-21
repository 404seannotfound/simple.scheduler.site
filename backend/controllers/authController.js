const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

const User = require('../models/User');
const transporter = require('../utils/mailer');
const { createOAuthClient } = require('../utils/googleClient');

const VALID_TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

function normalizeAvailabilityWindows(inputWindows) {
  if (!Array.isArray(inputWindows)) {
    return [];
  }

  return inputWindows
    .map((window) => ({
      dayOfWeek: Number(window.dayOfWeek),
      startTime: String(window.startTime || '').trim(),
      endTime: String(window.endTime || '').trim(),
    }))
    .filter((window) => Number.isInteger(window.dayOfWeek) && window.dayOfWeek >= 0 && window.dayOfWeek <= 6)
    .filter((window) => VALID_TIME_REGEX.test(window.startTime) && VALID_TIME_REGEX.test(window.endTime))
    .filter((window) => window.startTime < window.endTime);
}

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ msg: 'username, email, and password are required' });
    }

    const existing = await User.findOne({ 
      where: { 
        [Op.or]: [{ email }, { username }] 
      } 
    });
    if (existing) {
      return res.status(400).json({ msg: 'User with this email or username already exists' });
    }

    const hashedPw = await bcrypt.hash(password, 12);
    const token = crypto.randomBytes(20).toString('hex');

    const verifyUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/verify/${token}`;
    let emailSent = false;
    
    // Send email but don't block registration if email fails
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Verify Your Email',
          text: `Click to verify your email: ${verifyUrl}`,
        });
        emailSent = true;
      } else {
        console.warn('Email credentials not configured, auto-verifying user');
      }
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr.message);
    }

    // Auto-verify if email not sent (allows immediate login)
    const user = await User.create({
      username,
      email,
      password: hashedPw,
      verificationToken: emailSent ? token : null,
      isVerified: !emailSent,
    });

    return res.status(201).json({ 
      msg: emailSent 
        ? 'Registration successful. Check your email for verification link.'
        : 'Registration successful. You can now login.',
      verifyUrl: process.env.NODE_ENV !== 'production' && emailSent ? verifyUrl : undefined
    });
  } catch (err) {
    return res.status(500).json({ msg: 'Registration failed', error: err.message });
  }
};

exports.getAvailability = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['shareAvailability', 'availabilityWindows']
    });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    return res.json({
      shareAvailability: Boolean(user.shareAvailability),
      availabilityWindows: user.availabilityWindows || [],
    });
  } catch (err) {
    return res.status(500).json({ msg: 'Failed to fetch availability settings', error: err.message });
  }
};

exports.updateAvailability = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (typeof req.body.shareAvailability === 'boolean') {
      user.shareAvailability = req.body.shareAvailability;
    }

    if (Array.isArray(req.body.availabilityWindows)) {
      user.availabilityWindows = normalizeAvailabilityWindows(req.body.availabilityWindows);
    }

    await user.save();

    return res.json({
      msg: 'Availability updated',
      shareAvailability: Boolean(user.shareAvailability),
      availabilityWindows: user.availabilityWindows || [],
    });
  } catch (err) {
    return res.status(500).json({ msg: 'Failed to update availability settings', error: err.message });
  }
};

exports.verify = async (req, res) => {
  try {
    const user = await User.findOne({ where: { verificationToken: req.params.token } });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    return res.json({ msg: 'Email verified' });
  } catch (err) {
    return res.status(500).json({ msg: 'Verification failed', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !user.isVerified || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        shareAvailability: user.shareAvailability,
        availabilityWindows: user.availabilityWindows,
      },
    });
  } catch (err) {
    return res.status(500).json({ msg: 'Login failed', error: err.message });
  }
};

exports.googleAuth = (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(401).json({ msg: 'Missing auth token' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (_err) {
    return res.status(401).json({ msg: 'Invalid auth token' });
  }

  const oauth2Client = createOAuthClient();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
    prompt: 'consent',
    state: decoded.id,
  });

  return res.redirect(authUrl);
};

exports.googleCallback = async (req, res) => {
  try {
    const oauth2Client = createOAuthClient();
    const { tokens } = await oauth2Client.getToken(req.query.code);

    const userId = req.query.state;
    if (!userId) {
      return res.status(400).json({ msg: 'Missing callback state' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.googleAccessToken = tokens.access_token;
    if (tokens.refresh_token) {
      user.googleRefreshToken = tokens.refresh_token;
    }
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/dashboard?googleConnected=true`);
  } catch (err) {
    return res.status(500).json({ msg: 'Google OAuth callback failed', error: err.message });
  }
};
