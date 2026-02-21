const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    verificationToken: String,
    googleAccessToken: String,
    googleRefreshToken: String,
    shareAvailability: { type: Boolean, default: false },
    availabilityWindows: [
      {
        dayOfWeek: { type: Number, min: 0, max: 6, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
