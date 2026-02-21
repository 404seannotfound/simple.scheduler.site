import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { useAppSettings } from '../context/AppSettingsContext';
import { formatDateTime } from '../utils/dateTime';

const CalendarView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [busySlots, setBusySlots] = useState([]);
  const [message, setMessage] = useState('');
  const { settings } = useAppSettings();

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
        {settings.branding.logoUrl && (
          <img className="brand-logo" src={settings.branding.logoUrl} alt={`${settings.branding.companyName} logo`} />
        )}
        <h1>{settings.branding.companyName} Availability</h1>
        <p className="muted">Busy blocks for the next 30 days from your connected Google Calendar.</p>

        {message && <p className="muted">{message}</p>}

        {!message && busySlots.length === 0 && <p className="muted">No busy slots found.</p>}

        {busySlots.length > 0 && (
          <ul className="stack-list">
            {busySlots.map((slot, idx) => (
              <li key={`${slot.start}-${idx}`}>
                {formatDateTime(slot.start, settings.preferences.dateFormat, settings.preferences.timezone)} -{' '}
                {formatDateTime(slot.end, settings.preferences.dateFormat, settings.preferences.timezone)}
              </li>
            ))}
          </ul>
        )}

        {settings.supportEmail && <p className="muted">Support: {settings.supportEmail}</p>}

        <Link to={`/meeting/${id}`}>Back to meeting</Link>
      </div>
    </div>
  );
};

export default CalendarView;
