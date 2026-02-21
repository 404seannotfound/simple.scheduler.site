import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getDefaultAvailabilityRows() {
  return WEEKDAY_LABELS.map((label, dayOfWeek) => ({
    dayOfWeek,
    label,
    enabled: false,
    startTime: '09:00',
    endTime: '17:00',
  }));
}

function buildRowsFromWindows(windows) {
  const rows = getDefaultAvailabilityRows();
  (windows || []).forEach((window) => {
    if (Number.isInteger(window.dayOfWeek) && window.dayOfWeek >= 0 && window.dayOfWeek <= 6) {
      rows[window.dayOfWeek] = {
        ...rows[window.dayOfWeek],
        enabled: true,
        startTime: window.startTime || rows[window.dayOfWeek].startTime,
        endTime: window.endTime || rows[window.dayOfWeek].endTime,
      };
    }
  });
  return rows;
}

const Dashboard = () => {
  const [meetings, setMeetings] = useState([]);
  const [title, setTitle] = useState('');
  const [attendeesEmails, setAttendeesEmails] = useState('');
  const [googleMeetLink, setGoogleMeetLink] = useState('');
  const [message, setMessage] = useState('');
  const [shareAvailability, setShareAvailability] = useState(false);
  const [availabilityRows, setAvailabilityRows] = useState(getDefaultAvailabilityRows);
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const navigate = useNavigate();

  const user = useMemo(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }

    const loadMeetings = async () => {
      try {
        const [meetingsRes, availabilityRes] = await Promise.all([
          api.get('/meetings'),
          api.get('/auth/availability'),
        ]);
        setMeetings(meetingsRes.data || []);
        setShareAvailability(Boolean(availabilityRes.data?.shareAvailability));
        setAvailabilityRows(buildRowsFromWindows(availabilityRes.data?.availabilityWindows || []));
      } catch (err) {
        setMessage(err.response?.data?.msg || 'Failed to fetch meetings');
      }
    };

    loadMeetings();
  }, [navigate]);

  const createMeeting = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const payload = {
        title,
        googleMeetLink,
        attendeesEmails: attendeesEmails
          .split(',')
          .map((email) => email.trim())
          .filter(Boolean),
      };
      const res = await api.post('/meetings/create', payload);
      setMeetings((prev) => [res.data, ...prev]);
      setTitle('');
      setAttendeesEmails('');
      setGoogleMeetLink('');
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Failed to create meeting');
    }
  };

  const connectGoogle = () => {
    const baseApi = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('Please log in before connecting Google Calendar.');
      return;
    }
    window.location.href = `${baseApi}/api/auth/google?token=${encodeURIComponent(token)}`;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const updateAvailabilityRow = (dayOfWeek, changes) => {
    setAvailabilityRows((prev) =>
      prev.map((row) => (row.dayOfWeek === dayOfWeek ? { ...row, ...changes } : row))
    );
  };

  const saveAvailability = async () => {
    setAvailabilityMessage('');

    try {
      const availabilityWindows = availabilityRows
        .filter((row) => row.enabled)
        .map((row) => ({
          dayOfWeek: row.dayOfWeek,
          startTime: row.startTime,
          endTime: row.endTime,
        }));

      await api.put('/auth/availability', {
        shareAvailability,
        availabilityWindows,
      });

      setAvailabilityMessage('Availability preferences saved.');
    } catch (err) {
      setAvailabilityMessage(err.response?.data?.msg || 'Failed to save availability preferences');
    }
  };

  return (
    <div className="page dashboard-page">
      <div className="container">
        <header className="dashboard-header card">
          <div className="availability-section">
            <h2>Availability Preferences</h2>
            {user ? `${user.username}'s` : ''} 
            <p className="muted"></p>
          </div>
          <div className="header-actions">
            <button onClick={connectGoogle}>Connect Google Calendar</button>
            <button className="secondary" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        <form className="card form" onSubmit={createMeeting}>
          <h2>Create meeting</h2>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Meeting title"
            required
          />
          <input
            value={attendeesEmails}
            onChange={(e) => setAttendeesEmails(e.target.value)}
            placeholder="Attendee emails (comma-separated)"
          />
          <input
            value={googleMeetLink}
            onChange={(e) => setGoogleMeetLink(e.target.value)}
            placeholder="Google Meet link"
          />
          <button type="submit">Create</button>
          {message && <p className="muted">{message}</p>}
        </form>

        <section className="card">
          <h2>My availability</h2>
          <label className="availability-share-toggle">
            <input
              type="checkbox"
              checked={shareAvailability}
              onChange={(e) => setShareAvailability(e.target.checked)}
            />
            Share my available times with meeting participants
          </label>

          <div className="availability-grid">
            {availabilityRows.map((row) => (
              <div className="availability-row" key={row.dayOfWeek}>
                <label>
                  <input
                    type="checkbox"
                    checked={row.enabled}
                    onChange={(e) => updateAvailabilityRow(row.dayOfWeek, { enabled: e.target.checked })}
                  />
                  {row.label}
                </label>
                <input
                  type="time"
                  value={row.startTime}
                  onChange={(e) => updateAvailabilityRow(row.dayOfWeek, { startTime: e.target.value })}
                  disabled={!row.enabled}
                />
                <input
                  type="time"
                  value={row.endTime}
                  onChange={(e) => updateAvailabilityRow(row.dayOfWeek, { endTime: e.target.value })}
                  disabled={!row.enabled}
                />
              </div>
            ))}
          </div>
          <button onClick={saveAvailability}>Save availability settings</button>
          {availabilityMessage && <p className="muted">{availabilityMessage}</p>}
        </section>

        <section className="card">
          <h2>Your meetings</h2>
          {meetings.length === 0 ? (
            <p className="muted">No meetings yet.</p>
          ) : (
            <ul className="meeting-list">
              {meetings.map((meeting) => (
                <li key={meeting._id}>
                  <div>
                    <strong>{meeting.title}</strong>
                    <p className="muted">
                      {meeting.confirmedTime
                        ? `Confirmed: ${new Date(meeting.confirmedTime).toLocaleString()}`
                        : 'Pending confirmation'}
                    </p>
                    <p className="muted">
                      Updated {new Date(meeting.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="meeting-actions">
                    <Link to={`/meeting/${meeting._id}`}>Open</Link>
                    <Link to={`/calendar/${meeting._id}`}>Calendar</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        {settings.supportEmail && <p className="muted">Support: {settings.supportEmail}</p>}
      </div>
    </div>
  );
};

export default Dashboard;
