import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAppSettings } from '../context/AppSettingsContext';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { settings } = useAppSettings();

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await api.post('/auth/login', formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Login failed');
    }
  };

  return (
    <div className="page auth-page">
      <form className="card form" onSubmit={onSubmit}>
        {settings.branding.logoUrl && (
          <img className="brand-logo" src={settings.branding.logoUrl} alt={`${settings.branding.companyName} logo`} />
        )}
        <p className="brand-kicker">{settings.branding.companyName}</p>
        <h1>Welcome back</h1>
        <p className="muted">{settings.branding.templateText}</p>
        <input name="email" type="email" placeholder="Email" onChange={onChange} required />
        <input name="password" type="password" placeholder="Password" onChange={onChange} required />
        <button type="submit">Login</button>
        {message && <p className="muted">{message}</p>}
        <p className="muted">
          Need an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
