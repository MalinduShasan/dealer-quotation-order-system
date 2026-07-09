# Project Overview

## Purpose

This project is a commercial-grade `Dealer Quotation & Order Management System` intended for real business usage, client demonstrations, and portfolio presentation. The platform is being designed as a modular B2B sales operations system rather than a simple CRUD application.

## Business Goal

The system will support quotation-driven sales workflows between internal staff and external dealers. It is expected to cover the full business lifecycle from product setup to quotation approval, order processing, reporting, notifications, and operational auditability.

## Current Technology Stack

### Frontend

- React
- React Router
- Context API
- Responsive CSS
- Shared dark/light theme system

### Backend

- Node.js
- Express.js
- JWT authentication

### Database and Storage

- Supabase PostgreSQL
- Supabase Storage

### Deployment Targets

- Vercel for frontend
- Render or Railway for backend
- Supabase for database and storage

## Current Functional Scope

The repository currently contains the early-stage foundation for:

- user registration and login
- JWT-based protected routes
- role-based route guards
- product listing and creation
- quotation creation and listing
- dealer quotation review
- order creation and conversion from quotation
- modern responsive UI shell with dark/light mode

## Target User Roles

The long-term system is intended to support role-based access control with:

- Admin
- Sales Executive
- Manager
- Dealer

Permissions must remain extensible and must not be hardcoded into individual features.

## Architectural Direction

The project should follow clean architecture and modular separation.

### Frontend structure

- `components/`
- `pages/`
- `layouts/`
- `hooks/`
- `context/`
- `services/`
- `api/`
- `utils/`
- `assets/`

### Backend structure

- `routes/`
- `controllers/`
- `services/`
- `repositories/`
- `middleware/`
- `validators/`
- `config/`
- `utils/`
- `scripts/`

Business logic should gradually move out of route files and into controller/service/repository layers.

## Core Business Modules

The platform roadmap includes:

- Dashboard
- Authentication
- User Management
- Dealer Management
- Product Management
- Quotation Management
- Order Management
- Inventory
- Reports
- Notifications
- Audit Logs
- Settings

## Current Repository Notes

- The project has already been moved from MongoDB to Supabase PostgreSQL.
- The backend currently uses Supabase through the service role key.
- The frontend currently uses the backend API for most business flows and also includes a direct browser Supabase helper for client-side reads where appropriate.
- The UI foundation is now shared through a common theme system for premium responsive styling.

## Immediate Next Engineering Priorities

1. Move backend business logic from route files into controllers/services/repositories.
2. Implement a normalized RBAC model with roles and permissions tables.
3. Expand the database schema to include dealers, brands, categories, attachments, logs, sessions, and approval history.
4. Add validation middleware, rate limiting, helmet, and stronger security controls.
5. Build production-ready dashboards and CRUD modules per role.
6. Add reporting, notifications, storage integration, and audit trails.
