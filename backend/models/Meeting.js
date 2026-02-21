const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    proposedTimes: [
      {
        time: { type: Date, required: true },
        proposedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      },
    ],
    approvals: [
      {
        time: { type: Date, required: true },
        approvedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      },
    ],
    messages: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        date: { type: Date, default: Date.now },
      },
    ],
    confirmedTime: Date,
    googleMeetLink: String,
    calendarEventId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Meeting', meetingSchema);
