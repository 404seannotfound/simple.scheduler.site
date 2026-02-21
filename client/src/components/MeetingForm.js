import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api';

const MeetingForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [time, setTime] = useState('');
  const [newTime, setNewTime] = useState('');
  const [messageText, setMessageText] = useState('');
  const [message, setMessage] = useState('');

  const user = useMemo(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }, []);

  const isCreator = user && meeting && meeting.creator && String(meeting.creator._id || meeting.creator) === String(user.id);

  const loadMeeting = async () => {
    try {
      const res = await api.get(`/meetings/${id}`);
      setMeeting(res.data);
      setMessage('');
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Failed to load meeting');
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    loadMeeting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  const proposeTime = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/meetings/${id}/propose`, { time });
      setTime('');
      await loadMeeting();
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Failed to propose time');
    }
  };

  const approveTime = async (value) => {
    try {
      await api.post(`/meetings/${id}/approve`, { time: value });
      await loadMeeting();
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Failed to approve time');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/meetings/${id}/message`, { text: messageText });
      setMessageText('');
      await loadMeeting();
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Failed to send message');
    }
  };

  const moveMeeting = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/meetings/${id}/move`, { newTime });
      setNewTime('');
      await loadMeeting();
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Failed to move meeting');
    }
  };

  if (!meeting) {
    return (
      <div className="page">
        <div className="container card">
          <p>{message || 'Loading meeting...'}</p>
          <Link to="/dashboard">Back</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <section className="card">
          <h1>{meeting.title}</h1>
          <p className="muted">Meeting ID: {meeting._id}</p>
          {meeting.googleMeetLink && (
            <p>
              Join link: <a href={meeting.googleMeetLink}>{meeting.googleMeetLink}</a>
            </p>
          )}
          <p className="muted">
            {meeting.confirmedTime
              ? `Confirmed for ${new Date(meeting.confirmedTime).toLocaleString()}`
              : 'No confirmed time yet'}
          </p>
          <Link to="/dashboard">Back to dashboard</Link>
        </section>

        <section className="card">
          <h2>Proposed times</h2>
          {meeting.proposedTimes?.length ? (
            <ul className="stack-list">
              {meeting.proposedTimes.map((pt, index) => (
                <li key={`${pt.time}-${index}`}>
                  <div>
                    {new Date(pt.time).toLocaleString()}
                    <button onClick={() => approveTime(pt.time)}>Approve</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No proposed times yet.</p>
          )}

          <form className="inline-form" onSubmit={proposeTime}>
            <input
              type="datetime-local"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
            <button type="submit">Propose time</button>
          </form>
        </section>

        <section className="card">
          <h2>Messages</h2>
          {meeting.messages?.length ? (
            <ul className="stack-list">
              {meeting.messages.map((m, index) => (
                <li key={`${m.date}-${index}`}>
                  <strong>{m.user?.username || 'User'}:</strong> {m.text}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No messages yet.</p>
          )}

          <form className="inline-form" onSubmit={sendMessage}>
            <input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message"
              required
            />
            <button type="submit">Send</button>
          </form>
        </section>

        {isCreator && (
          <section className="card">
            <h2>Move meeting</h2>
            <form className="inline-form" onSubmit={moveMeeting}>
              <input
                type="datetime-local"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                required
              />
              <button type="submit">Move</button>
            </form>
          </section>
        )}

        {message && <p className="muted">{message}</p>}
      </div>
    </div>
  );
};

export default MeetingForm;
