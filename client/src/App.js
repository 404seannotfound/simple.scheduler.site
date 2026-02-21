import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import MeetingForm from './components/MeetingForm';
import CalendarView from './components/CalendarView';
import './styles.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/meeting/:id" element={<MeetingForm />} />
        <Route path="/calendar/:id" element={<CalendarView />} />
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
