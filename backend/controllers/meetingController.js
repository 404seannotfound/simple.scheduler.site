const { google } = require('googleapis');

const Meeting = require('../models/Meeting');
const User = require('../models/User');
const transporter = require('../utils/mailer');
const { createOAuthClient } = require('../utils/googleClient');

const HOUR_MS = 60 * 60 * 1000;

function isObjectIdEqual(a, b) {
  return String(a) === String(b);
}

function isParticipant(meeting, userId) {
  return (
    isObjectIdEqual(meeting.creator, userId) ||
    meeting.attendees.some((id) => isObjectIdEqual(id, userId))
  );
}

function getUtcDayAndTime(date) {
  const dayOfWeek = date.getUTCDay();
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  return { dayOfWeek, time: `${hh}:${mm}` };
}

function isWithinSharedAvailability(user, date) {
  if (!user?.shareAvailability) {
    return true;
  }

  const windows = Array.isArray(user.availabilityWindows) ? user.availabilityWindows : [];
  if (windows.length === 0) {
    return true;
  }

  const { dayOfWeek, time } = getUtcDayAndTime(date);
  return windows.some(
    (window) =>
      Number(window.dayOfWeek) === dayOfWeek &&
      typeof window.startTime === 'string' &&
      typeof window.endTime === 'string' &&
      window.startTime <= time &&
      time < window.endTime
  );
}

async function sendSimpleEmail(to, subject, text) {
  if (!to || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  });
}

async function addToCalendarForCreator(meeting) {
  const creator = await User.findById(meeting.creator);
  if (!creator || !creator.googleAccessToken) {
    return;
  }

  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials({
    access_token: creator.googleAccessToken,
    refresh_token: creator.googleRefreshToken,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const attendees = await User.find({ _id: { $in: meeting.attendees } }, { email: 1 });

  const event = {
    summary: meeting.title,
    start: { dateTime: meeting.confirmedTime.toISOString() },
    end: { dateTime: new Date(meeting.confirmedTime.getTime() + HOUR_MS).toISOString() },
    attendees: attendees.map((u) => ({ email: u.email })),
    location: meeting.googleMeetLink || undefined,
    description: meeting.googleMeetLink
      ? `Join link: ${meeting.googleMeetLink}`
      : 'Meeting scheduled in SimpleAnonymousScheduler',
  };

  const calendarRes = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
  });

  meeting.calendarEventId = calendarRes.data.id;
  await meeting.save();
}

exports.listMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({
      $or: [{ creator: req.user.id }, { attendees: req.user.id }],
    })
      .populate('creator', 'username email')
      .sort({ updatedAt: -1 });

    return res.json(meetings);
  } catch (err) {
    return res.status(500).json({ msg: 'Failed to fetch meetings', error: err.message });
  }
};

exports.getMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('creator', 'username email')
      .populate('attendees', 'username email')
      .populate('messages.user', 'username');

    if (!meeting) {
      return res.status(404).json({ msg: 'Meeting not found' });
    }

    if (!isParticipant(meeting, req.user.id)) {
      return res.status(403).json({ msg: 'Not authorized for this meeting' });
    }

    const participantIds = [meeting.creator._id, ...meeting.attendees.map((attendee) => attendee._id)];
    const sharedUsers = await User.find(
      {
        _id: { $in: participantIds },
        shareAvailability: true,
        'availabilityWindows.0': { $exists: true },
      },
      'username email availabilityWindows'
    );

    const meetingData = meeting.toObject();
    meetingData.sharedAvailability = sharedUsers.map((user) => ({
      userId: user._id,
      username: user.username,
      email: user.email,
      availabilityWindows: user.availabilityWindows,
    }));

    return res.json(meetingData);
  } catch (err) {
    return res.status(500).json({ msg: 'Failed to fetch meeting', error: err.message });
  }
};

exports.createMeeting = async (req, res) => {
  try {
    const { title, attendeesEmails = [], googleMeetLink } = req.body;

    if (!title) {
      return res.status(400).json({ msg: 'Meeting title is required' });
    }

    const attendees = await User.find({ email: { $in: attendeesEmails } });
    const meeting = new Meeting({
      title,
      creator: req.user.id,
      attendees: attendees.map((u) => u._id),
      googleMeetLink,
    });

    await meeting.save();

    await Promise.all(
      attendees.map((attendee) =>
        sendSimpleEmail(
          attendee.email,
          `New meeting invitation: ${title}`,
          `You were invited to a meeting in SimpleAnonymousScheduler.\nMeeting ID: ${meeting._id}`
        )
      )
    );

    return res.status(201).json(meeting);
  } catch (err) {
    return res.status(500).json({ msg: 'Failed to create meeting', error: err.message });
  }
};

exports.proposeTime = async (req, res) => {
  try {
    const { time } = req.body;
    const proposedTime = new Date(time);
    if (Number.isNaN(proposedTime.getTime())) {
      return res.status(400).json({ msg: 'Invalid proposed time' });
    }

    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ msg: 'Meeting not found' });
    }

    if (!isParticipant(meeting, req.user.id)) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const participantIds = [meeting.creator, ...meeting.attendees];
    const sharedUsers = await User.find(
      {
        _id: { $in: participantIds },
        shareAvailability: true,
      },
      'username availabilityWindows shareAvailability'
    );

    const unavailableUsers = sharedUsers
      .filter((user) => Array.isArray(user.availabilityWindows) && user.availabilityWindows.length > 0)
      .filter((user) => !isWithinSharedAvailability(user, proposedTime))
      .map((user) => user.username);

    if (unavailableUsers.length > 0) {
      return res.status(400).json({
        msg: `Proposed time is outside shared availability for: ${unavailableUsers.join(', ')}`,
      });
    }

    meeting.proposedTimes.push({
      time: proposedTime,
      proposedBy: req.user.id,
    });
    await meeting.save();

    return res.json(meeting);
  } catch (err) {
    return res.status(500).json({ msg: 'Failed to propose time', error: err.message });
  }
};

exports.approveTime = async (req, res) => {
  try {
    const { time } = req.body;
    const approvedTime = new Date(time);
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ msg: 'Meeting not found' });
    }

    if (!isParticipant(meeting, req.user.id)) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    let approval = meeting.approvals.find(
      (entry) => new Date(entry.time).getTime() === approvedTime.getTime()
    );

    if (!approval) {
      meeting.approvals.push({
        time: approvedTime,
        approvedBy: [req.user.id],
      });
      approval = meeting.approvals[meeting.approvals.length - 1];
    } else if (!approval.approvedBy.some((id) => isObjectIdEqual(id, req.user.id))) {
      approval.approvedBy.push(req.user.id);
    }

    const requiredApprovals = meeting.attendees.length + 1;
    if (approval.approvedBy.length >= requiredApprovals) {
      meeting.confirmedTime = approvedTime;
    }

    await meeting.save();

    if (meeting.confirmedTime) {
      const participants = await User.find({
        _id: { $in: [meeting.creator, ...meeting.attendees] },
      });

      await Promise.all(
        participants.map((user) =>
          sendSimpleEmail(
            user.email,
            `Meeting confirmed: ${meeting.title}`,
            `Time: ${meeting.confirmedTime.toISOString()}\nLink: ${meeting.googleMeetLink || 'No link provided'}`
          )
        )
      );

      if (!meeting.calendarEventId) {
        await addToCalendarForCreator(meeting);
      }
    }

    return res.json(meeting);
  } catch (err) {
    return res.status(500).json({ msg: 'Failed to approve time', error: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ msg: 'Meeting not found' });
    }

    if (!isParticipant(meeting, req.user.id)) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    meeting.messages.push({
      user: req.user.id,
      text,
      date: new Date(),
    });

    await meeting.save();
    return res.json(meeting);
  } catch (err) {
    return res.status(500).json({ msg: 'Failed to send message', error: err.message });
  }
};

exports.viewCalendar = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id).populate('attendees', 'googleAccessToken googleRefreshToken');
    if (!meeting) {
      return res.status(404).json({ msg: 'Meeting not found' });
    }

    if (!isParticipant(meeting, req.user.id)) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const user = await User.findById(req.user.id);
    if (!user?.googleAccessToken) {
      return res.status(400).json({ msg: 'Connect Google Calendar first' });
    }

    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const freeBusyReq = {
      timeMin: new Date().toISOString(),
      timeMax: new Date(Date.now() + 30 * 24 * HOUR_MS).toISOString(),
      items: [{ id: 'primary' }],
    };

    const freeBusy = await calendar.freebusy.query({ resource: freeBusyReq });
    return res.json(freeBusy.data.calendars || {});
  } catch (err) {
    return res.status(500).json({ msg: 'Failed to fetch calendar availability', error: err.message });
  }
};

exports.moveMeeting = async (req, res) => {
  try {
    const { newTime } = req.body;
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ msg: 'Meeting not found' });
    }

    if (!isObjectIdEqual(meeting.creator, req.user.id)) {
      return res.status(403).json({ msg: 'Only creator can move meeting' });
    }

    const creator = await User.findById(req.user.id);
    if (!creator?.googleAccessToken || !meeting.calendarEventId) {
      meeting.confirmedTime = new Date(newTime);
      await meeting.save();
      return res.json(meeting);
    }

    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials({
      access_token: creator.googleAccessToken,
      refresh_token: creator.googleRefreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const start = new Date(newTime);

    await calendar.events.patch({
      calendarId: 'primary',
      eventId: meeting.calendarEventId,
      resource: {
        start: { dateTime: start.toISOString() },
        end: { dateTime: new Date(start.getTime() + HOUR_MS).toISOString() },
      },
    });

    meeting.confirmedTime = start;
    await meeting.save();

    return res.json(meeting);
  } catch (err) {
    return res.status(500).json({ msg: 'Failed to move meeting', error: err.message });
  }
};
