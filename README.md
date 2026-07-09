# Dealer Quotation & Order Management System

This project uses a React frontend and a Node.js/Express backend. The backend now targets Supabase Postgres instead of MongoDB.

## Backend environment

Create a `backend/.env` file with:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret
CLIENT_ORIGIN=http://localhost:3000
PORT=5000
```

Or copy from [backend/.env.example](/abs/path/C:/Users/User/OneDrive%20-%20Faculty%20of%20Technology,%20University%20of%20Ruhuna/Projects/dealer-quotation-order-system/backend/.env.example:1).

## Frontend environment

Create a `frontend/.env` file with:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

Or copy from [frontend/.env.example](/abs/path/C:/Users/User/OneDrive%20-%20Faculty%20of%20Technology,%20University%20of%20Ruhuna/Projects/dealer-quotation-order-system/frontend/.env.example:1).

## Supabase setup

Run the SQL in [backend/supabase/schema.sql](/abs/path/C:/Users/User/OneDrive%20-%20Faculty%20of%20Technology,%20University%20of%20Ruhuna/Projects/dealer-quotation-order-system/backend/supabase/schema.sql:1) inside your Supabase SQL editor before starting the backend.

## First admin or dealer

The current register endpoint creates only `customer` users. For your first privileged account:

1. Generate a bcrypt password hash:

```powershell
cd backend
node scripts/hashPassword.js YourPassword123
```

2. Paste that hash into [backend/supabase/seed_admin.sql](/abs/path/C:/Users/User/OneDrive%20-%20Faculty%20of%20Technology,%20University%20of%20Ruhuna/Projects/dealer-quotation-order-system/backend/supabase/seed_admin.sql:1)
3. Run the edited SQL in the Supabase SQL editor

## Run locally

Backend:

```powershell
cd backend
npm start
```

Frontend:

```powershell
cd frontend
npm start
```

## Notes

- The app currently uses Supabase as the database layer and keeps JWT auth in the Express backend.
- The frontend API URL can be configured with `REACT_APP_API_URL`.
