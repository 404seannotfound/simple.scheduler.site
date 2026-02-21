import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import MeetingForm from './components/MeetingForm';
import CalendarView from './components/CalendarView';
import { AppSettingsProvider } from './context/AppSettingsContext';

function App() {
  return (
    <AppSettingsProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/meeting/:id" element={<MeetingForm />} />
          <Route path="/calendar/:id" element={<CalendarView />} />
        </Routes>
      </Router>
    </AppSettingsProvider>
  );
}

export default App;
