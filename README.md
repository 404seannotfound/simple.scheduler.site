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

### Step 1: Get Gmail SMTP Credentials

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** > **2-Step Verification** (enable if not already)
3. Scroll to **App passwords** and click it
4. Generate a new app password:
   - App: Select "Mail"
   - Device: Select "Other" and name it "SimpleScheduler"
5. Copy the 16-character password (no spaces)
6. Save these for deployment:
   - `EMAIL_USER`: Your full Gmail address (e.g., `yourname@gmail.com`)
   - `EMAIL_PASS`: The 16-character app password you just generated

### Step 2: Initial Render Deployment (Without Google OAuth)

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. In Render Dashboard, click **New > Blueprint**
3. Connect your repository
4. Render will prompt for secrets - enter:
   - `EMAIL_USER`: Your Gmail address from Step 1
   - `EMAIL_PASS`: Your Gmail app password from Step 1
   - `GOOGLE_CLIENT_ID`: Leave blank or enter `placeholder`
   - `GOOGLE_CLIENT_SECRET`: Leave blank or enter `placeholder`
   - `GOOGLE_REDIRECT_URI`: Leave blank or enter `placeholder`
5. Deploy and wait for services to go live
6. **Copy your backend URL** from Render dashboard (e.g., `https://simple-anonymous-scheduler-api-abc123.onrender.com`)

### Step 3: Configure Google OAuth Credentials

1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Create a new project (or select existing):
   - Click project dropdown → **New Project**
   - Name: "SimpleScheduler" → Create
3. Enable Google Calendar API:
   - Navigate to **APIs & Services** > **Library**
   - Search for "Google Calendar API" → Enable
4. Create OAuth 2.0 credentials:
   - Go to **APIs & Services** > **Credentials**
   - Click **+ CREATE CREDENTIALS** > **OAuth client ID**
   - Configure consent screen if prompted:
     - User Type: External → Create
     - App name: "SimpleScheduler"
     - User support email: Your email
     - Developer contact: Your email → Save
   - Application type: **Web application**
   - Name: "SimpleScheduler Backend"
   - **Authorized redirect URIs**: Add your backend URL from Step 2:
     ```
     https://simple-anonymous-scheduler-api-abc123.onrender.com/api/auth/google/callback
     ```
     (Replace with YOUR actual backend URL)
   - Click **Create**
5. Copy the credentials shown:
   - `GOOGLE_CLIENT_ID`: The Client ID (looks like `123456789-abc.apps.googleusercontent.com`)
   - `GOOGLE_CLIENT_SECRET`: The Client Secret (looks like `GOCSPX-abc123...`)

### Step 4: Update Render with Google Credentials

1. In Render Dashboard, go to your backend service
2. Click **Environment** tab
3. Update these variables:
   - `GOOGLE_CLIENT_ID`: Paste from Step 3
   - `GOOGLE_CLIENT_SECRET`: Paste from Step 3
   - `GOOGLE_REDIRECT_URI`: `https://YOUR-BACKEND-URL.onrender.com/api/auth/google/callback`
4. Save changes - Render will auto-redeploy
5. Database tables will be created automatically on first startup

### Summary of What Render Auto-Generates

✅ **Render handles automatically:**
- `DATABASE_URL` - Generated from managed Postgres and auto-wired
- `JWT_SECRET` - Auto-generated secure random string
- `BACKEND_URL` - Your backend service URL (e.g., `https://simple-anonymous-scheduler-api-xyz.onrender.com`)
- `FRONTEND_URL` - Your frontend service URL (e.g., `https://simple-anonymous-scheduler-web-xyz.onrender.com`)

⚠️ **You must provide (external services):**
- `EMAIL_USER` / `EMAIL_PASS` - From your Gmail account settings
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` - From Google Cloud Console (requires your Render backend URL first)

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
