# SimpleAnonymousScheduler

Full-stack meeting scheduler with anonymous invite flow, email notifications, and Google Calendar integration.

## Stack
- Backend: Node.js, Express, MongoDB (Mongoose), JWT, Nodemailer, Google APIs
- Frontend: React, React Router, Axios
- Deployment: Render (Backend Web Service + Frontend Static Site) and MongoDB Atlas

## Prerequisites
- Node.js 18+
- MongoDB Atlas cluster
- Google Cloud OAuth credentials (Calendar API enabled)
- Email provider credentials (Gmail app password or SendGrid SMTP)

## Quick Start
1. Install dependencies:
   ```bash
   npm install
   npm install --prefix backend
   npm install --prefix client
   ```
2. Configure env files:
   - Copy `backend/.env.example` to `backend/.env`
   - Copy `client/.env.example` to `client/.env`
3. Run locally:
   ```bash
   npm start
   ```

- Backend: http://localhost:5000
- Frontend: http://localhost:3000

## Render Deployment
### Backend Web Service
- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Set environment variables from `backend/.env.example`
- Include `ADMIN_SETUP_TOKEN` for first deploy bootstrap

### Frontend Static Site
- Root directory: `client`
- Build command: `npm install && npm run build`
- Publish directory: `build`
- Set `REACT_APP_API_URL` to your deployed backend URL + `/api`

## Root Admin Utility Page
- URL: `https://<your-backend-service>.onrender.com/`
- Purpose:
  - Service health + config visibility (`/api/admin/health`)
  - Public frontend branding/preferences feed (`/api/admin/public-settings`)
  - First-time bootstrap for admin settings token (`/api/admin/bootstrap`)
  - Runtime app settings updates (`/api/admin/settings`)

### First Deploy Setup (Render)
1. In Render backend environment variables, set `ADMIN_SETUP_TOKEN` to a strong temporary value.
2. Deploy backend.
3. Open backend root URL (`/`) and run **First Deploy Bootstrap** using that setup token.
4. Save the returned **admin token** in your password manager.
5. Use that admin token on the same page to load/update settings (logo URL, template text, date format, timezone, support email).
6. Rotate/remove `ADMIN_SETUP_TOKEN` in Render after bootstrap to reduce risk.

## Dynamic Frontend Settings
The React app loads runtime settings from `/api/admin/public-settings` and uses them for:
- Company name + logo on auth/dashboard/calendar screens
- Template text on auth/dashboard
- Date format + timezone in meeting and calendar timestamps
- Support email footer hints

## Notes
- Google Meet links are user-provided when creating a meeting.
- Google Calendar OAuth callback URL must match your deployed backend URL.
- Anonymous attendees can be represented by invite links or email-only invitees, while core users sign in.
