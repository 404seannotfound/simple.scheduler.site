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

### Frontend Static Site
- Root directory: `client`
- Build command: `npm install && npm run build`
- Publish directory: `build`
- Set `REACT_APP_API_URL` to your deployed backend URL + `/api`

## Notes
- Google Meet links are user-provided when creating a meeting.
- Google Calendar OAuth callback URL must match your deployed backend URL.
- Anonymous attendees can be represented by invite links or email-only invitees, while core users sign in.
