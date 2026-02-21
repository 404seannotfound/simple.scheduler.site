require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { sequelize, testConnection } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const meetingRoutes = require('./routes/meetingRoutes');

testConnection();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);

const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true }).then(() => {
  app.listen(PORT, () => {
    console.log(`✓ Server running on ${PORT}`);
  });
}).catch(err => {
  console.error('✗ Failed to sync database:', err);
  process.exit(1);
});
