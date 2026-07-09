# Deployment Guide

## Target Deployment Model

- Frontend: Vercel
- Backend: Render or Railway
- Database: Supabase
- Storage: Supabase Storage

## Local Environment

### Backend

Required variables in `backend/.env`:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `CLIENT_ORIGIN`
- `PORT`

### Frontend

Required variables in `frontend/.env.local` or equivalent:

- `REACT_APP_API_URL`
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_PUBLISHABLE_KEY`

## Supabase Setup

1. Create a Supabase project.
2. Run `backend/supabase/schema.sql`.
3. Generate password hashes using `backend/scripts/hashPassword.js`.
4. Update and run `backend/supabase/seed_admin.sql`.

## Backend Deployment

Recommended steps:

1. Deploy the `backend/` service to Render or Railway.
2. Set environment variables securely in the hosting dashboard.
3. Ensure `CLIENT_ORIGIN` includes the frontend production URL.
4. Configure health monitoring and restart policy.

## Frontend Deployment

Recommended steps:

1. Deploy the `frontend/` app to Vercel.
2. Set production env variables.
3. Point `REACT_APP_API_URL` to the deployed backend URL.

## Production Security Checklist

- set strong `JWT_SECRET`
- restrict CORS to real frontend origins
- never expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend
- enable HTTPS
- add rate limiting
- add helmet
- review Supabase policies
- rotate secrets when needed

## Future Production Improvements

- CI/CD pipeline
- preview environments
- automated testing
- migration management
- error logging and alerting
- backup verification
- uptime monitoring
