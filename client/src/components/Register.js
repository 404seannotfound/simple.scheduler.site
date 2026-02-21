import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAppSettings } from '../context/AppSettingsContext';

const Register = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { settings } = useAppSettings();

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await api.post('/auth/register', formData);
      setMessage(res.data.msg || 'Check your email for verification');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Registration failed');
    }
  };

  return (
    <div className="page auth-page">
      <form className="card form" onSubmit={onSubmit}>
        {settings.branding.logoUrl && (
          <img className="brand-logo" src={settings.branding.logoUrl} alt={`${settings.branding.companyName} logo`} />
        )}
        <p className="brand-kicker">{settings.branding.companyName}</p>
        <h1>Create account</h1>
        <p className="muted">{settings.branding.templateText}</p>
        <input name="username" placeholder="Username" onChange={onChange} required />
        <input name="email" type="email" placeholder="Email" onChange={onChange} required />
        <input name="password" type="password" placeholder="Password" onChange={onChange} required />
        <button type="submit">Register</button>
        {message && <p className="muted">{message}</p>}
        <p className="muted">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
