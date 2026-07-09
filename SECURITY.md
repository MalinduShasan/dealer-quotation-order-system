# Security Policy

## Supported Scope

This project is under active development. Security practices are being introduced progressively as the platform moves toward commercial readiness.

## Current Security Controls

- JWT authentication
- bcrypt password hashing
- environment-based secrets
- protected route middleware
- role-based route guards
- controlled CORS origin list

## Security Gaps To Address

The following items are still required for stronger enterprise readiness:

- helmet middleware
- rate limiting
- centralized validation layer
- refresh tokens
- secure session lifecycle
- audit logging
- account verification flows
- password reset flow
- fine-grained RBAC in the database
- Supabase RLS policies where appropriate

## Reporting

If you discover a security issue, do not disclose it publicly before it is reviewed and fixed.

Recommended disclosure contents:

- summary of the issue
- reproduction steps
- affected files or modules
- risk level
- suggested fix if known
