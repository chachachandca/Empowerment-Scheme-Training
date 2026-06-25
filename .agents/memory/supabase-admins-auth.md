---
name: Supabase admins table auth
description: How admin authentication works — Supabase custom table, not Supabase Auth; plain-text passwords in password_hash field.
---

# Supabase Admins Auth

**Why:** Admins were added to a custom Supabase `admins` table, not registered as Supabase Auth users.

## Table shape (Supabase)
- `id` — UUID
- `username` — email address (used as login identifier)
- `password_hash` — **plain-text** password (despite the column name)
- `role` — e.g. "admin"
- `created_at`, `updated_at`
- `email` — nullable, unused

## How to apply
- Backend login: `POST /api/auth/login` checks local Drizzle `admins` table first (SHA256 hash), then falls back to Supabase `admins` table (plain-text comparison on `password_hash`).
- Password change: `PATCH /api/auth/password` requires active session cookie, verifies current password against Supabase table, updates `password_hash`.
- Frontend `adminAuth.ts`: calls backend directly via fetch, no Supabase Auth SDK used.
- Session: backend cookie (`admin_token`) stored in in-memory Map `activeSessions`; 24h TTL.

## Adding new admins
Insert a row in Supabase `admins` table: `username` = email, `password_hash` = plain-text password, `role` = "admin". No code changes needed.
