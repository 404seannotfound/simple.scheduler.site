import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api';

const CalendarView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [busySlots, setBusySlots] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }

    const loadCalendar = async () => {
      try {
        const res = await api.get(`/meetings/${id}/calendar`);
        const primary = res.data?.primary;
        setBusySlots(primary?.busy || []);
      } catch (err) {
        setMessage(err.response?.data?.msg || 'Failed to load calendar data');
      }
    };

    loadCalendar();
  }, [id, navigate]);

  return (
    <div className="page">
      <div className="container card">
        <h1>Calendar Availability</h1>
        <p className="muted">Busy blocks for the next 30 days from your connected Google Calendar.</p>

        {message && <p className="muted">{message}</p>}

        {!message && busySlots.length === 0 && <p className="muted">No busy slots found.</p>}

        {busySlots.length > 0 && (
          <ul className="stack-list">
            {busySlots.map((slot, idx) => (
              <li key={`${slot.start}-${idx}`}>
                {new Date(slot.start).toLocaleString()} - {new Date(slot.end).toLocaleString()}
              </li>
            ))}
          </ul>
        )}

        <Link to={`/meeting/${id}`}>Back to meeting</Link>
      </div>
    </div>
  );
};

export default CalendarView;
