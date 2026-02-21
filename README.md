# SimpleAnonymousScheduler

A full-stack scheduling application built with React and Node.js that helps users coordinate meeting times anonymously.

## Stack

- **Backend:** Node.js, Express, PostgreSQL (Sequelize), JWT, Nodemailer, Google APIs
- **Frontend:** React, React Router, Axios
- **Deployment:** Render.com (Web Service + Static Site + Managed Postgres)

## Prerequisites

- Node.js 18+
- PostgreSQL (local development) or Render managed Postgres (production)
- Gmail account (for sending emails via Nodemailer)
- Google Cloud Project with Calendar API enabled
- Render.com account

## Quick Start (Local)

1. **Clone and install:**
   ```bash
   git clone <repo-url>
   cd SimpleSchedulerSite
   npm install
   cd backend && npm install
   cd ../client && npm install
   cd ..
   ```

2. **Set up local PostgreSQL:**
   ```bash
   createdb scheduler
   ```

3. **Configure backend environment:**
   - Copy `backend/.env.example` to `backend/.env`
   - Set `DATABASE_URL=postgres://localhost:5432/scheduler`
   - Set `JWT_SECRET` to a secure random string
   - Configure email credentials (`EMAIL_USER`, `EMAIL_PASS`)
   - Add Google OAuth credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`)
   - Set `FRONTEND_URL=http://localhost:3000`
   - Set `BACKEND_URL=http://localhost:5000`

4. **Configure frontend environment:**
   - Copy `client/.env.example` to `client/.env`
   - Set `REACT_APP_API_URL=http://localhost:5000/api`

5. **Run the app:**
   ```bash
   npm start
   ```
   This runs both backend (port 5000) and frontend (port 3000) concurrently.
   The backend will automatically create database tables on first run.

- Backend: http://localhost:5000
- Frontend: http://localhost:3000

## Deploy to Render

This project includes a `render.yaml` blueprint for **fully managed one-click deployment** with Render Postgres.

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. In Render Dashboard, click **New > Blueprint**
3. Connect your repository
4. Render will:
   - Provision a managed PostgreSQL database
   - Auto-wire `DATABASE_URL` from the database to the backend
   - Auto-generate `JWT_SECRET`
   - Prompt only for external secrets:
     - `EMAIL_USER` / `EMAIL_PASS`: Gmail SMTP credentials
     - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI`: Google OAuth credentials (set redirect URI to `https://<your-backend>.onrender.com/api/auth/google/callback`)
5. Deploy and wait for all services to go live
6. Database tables will be created automatically on first backend startup

## Features

- User registration and email verification
- JWT-based authentication
- Google Calendar integration (OAuth2)
- Meeting creation with attendee emails
- Propose and approve meeting times
- Availability preferences (opt-in weekly time windows)
- Proposed times validated against shared availability
- In-meeting messaging
- Meeting rescheduling
- Calendar busy slots view

## Notes
- Google Meet links are user-provided when creating a meeting.
- Google Calendar OAuth callback URL must match your deployed backend URL.
- Anonymous attendees can be represented by invite links or email-only invitees, while core users sign in.
