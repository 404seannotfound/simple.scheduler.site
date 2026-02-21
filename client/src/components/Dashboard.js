import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const Dashboard = () => {
  const [meetings, setMeetings] = useState([]);
  const [title, setTitle] = useState('');
  const [attendeesEmails, setAttendeesEmails] = useState('');
  const [googleMeetLink, setGoogleMeetLink] = useState('');
  const [message, setMessage] = useState('');
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
        const res = await api.get('/meetings');
        setMeetings(res.data || []);
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

  return (
    <div className="page dashboard-page">
      <div className="container">
        <header className="dashboard-header card">
          <div>
            <h1>{user ? `${user.username}'s Dashboard` : 'Dashboard'}</h1>
            <p className="muted">Create and coordinate meetings with approvals.</p>
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
      </div>
    </div>
  );
};

export default Dashboard;
