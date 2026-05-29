# SMS Banking Bridge MVP

## Overview

A read-only SMS banking bridge for users with feature phones. Users register on the web portal, link a bank account with mock data, and can then text commands to check their balance and recent transactions. An admin dashboard provides full oversight.

## Architecture

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (wouter routing, TanStack Query, Tailwind CSS)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (port /api)
│   └── sms-banking/        # React+Vite frontend (port /)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/
│   └── src/seed.ts         # Database seeder with mock data
```

## Features

### User-Facing
- Landing page (hero, how it works, security, FAQ, pricing, SMS commands)
  - Animated bank logos marquee (16 US banks)
  - 3-tier pricing (Basic $0, Plus $4, Pro $9)
  - FAQ accordion section
  - Contact form (sends to `/api/contact`)
- Registration portal (3-step: info → SMS consent → bank link)
  - Auto-capitalized first/last names
  - Country-code phone input (60+ countries, searchable)
  - Google Sign-In integration
- Privacy Policy and Terms of Service pages
- SMS commands: BAL, BAL [nickname], TRANS, HELP, STOP

### My Account / Dashboard
- Sign-in with phone + password or Google Sign-In
- Forgot password via email link or SMS OTP
- Auto-logout after 30 minutes of inactivity (60-second warning modal)
- Profile dropdown (settings, report bug, sign out)
- Onboarding progress map (4 steps with progress bar)
- Report Bug modal (submits to contact API)
- **Real-time financial summary** — Total Balance + Credit Debt cards always visible above tabs
- **6 nav tabs**: Accounts, Transactions, Spending, Alerts, SMS, Settings
- **Spending tab** — AI-powered spending breakdown by category (Today / This Month toggle); colored bar chart per category; full categories management (list, edit color/name/keywords, create custom, delete)
- **Alerts tab** — configure proactive SMS alerts: Low Balance ($ threshold), Credit Limit Near Max (% threshold), Large Transaction ($ threshold), Transfer Cleared; each with on/off toggle

### Admin Dashboard (/admin)
- Overview stats (users, accounts, SMS activity)
- Users tab: phone, consent status, onboarding status, last activity
- Linked Accounts tab: masked to last 4 digits only
- SMS Logs tab: inbound/outbound activity log
- Settings tab: alert toggles, weekend pause (Fri PM–Sat night), thresholds

## Database Schema

- `users` — phone, consent, opt-out, onboarding status, password reset fields, Google auth fields
- `accounts` — linked bank accounts (last 4 digits only stored)
- `transactions` — read-only transaction records
- `sms_logs` — inbound/outbound SMS activity
- `alert_settings` — global alert configuration
- `categories` — spending categories per user (system defaults + custom); AI keyword matching
- `alerts` — per-user alert rules (low balance, large transaction, etc.)
- `phones` — additional linked phone numbers per user (premium)
- `trusted_devices` — 30-day device trust tokens per user

## API Routes

All routes at `/api`:
- `GET /healthz` — health check
- `POST /users/register` — register new user
- `GET /users` — list all users (admin)
- `GET /users/:id` — get user + accounts
- `POST /accounts` — link bank account
- `GET /accounts/:userId` — user accounts
- `GET /transactions/:userId` — recent transactions
- `GET /sms/logs` — SMS activity logs (admin)
- `POST /sms/simulate` — simulate SMS command (demo)
- `GET /admin/stats` — dashboard stats
- `GET /settings/alerts` — alert settings
- `PUT /settings/alerts` — update alert settings

## Security Model

- **Token auth** — clients receive a signed, expiring `sessionToken` from auth
  endpoints (login, signup, verify, Google, register) and send it as
  `Authorization: Bearer <token>`. A global fetch interceptor on the frontend
  attaches it automatically.
- **Authorization** — `requireAuth`/`requireSelf`/`requireAdmin` middleware
  guard all per-user and admin routes; a user can only access their own data.
- **Admin** — `/admin/login` issues a short-lived signed admin token; admin data
  routes require it.
- **SMS webhook** — inbound `/api/sms/webhook` requests are signature-verified
  against the SignalWire auth token.
- **Secrets at rest** — Teller bank access tokens are encrypted (AES-256-GCM).
- **Rate limiting** — credential, OTP, and code-sending endpoints are throttled
  per IP.

### Environment Variables

Security-relevant configuration (set these in any non-local environment):

- `AUTH_SECRET` — **required**; HMAC key for signing session/admin tokens.
- `ADMIN_PASSWORD` — **required** to enable the admin dashboard (no default).
- `TELLER_ENCRYPTION_KEY` — key for encrypting bank access tokens at rest
  (falls back to `AUTH_SECRET` if unset).
- `SIGNALWIRE_TOKEN` — also used to validate inbound SMS webhook signatures.
- `PUBLIC_WEBHOOK_URL` — public URL SignalWire posts to (used for signature
  validation behind proxies; otherwise reconstructed from request headers).
- `CORS_ORIGIN` — optional comma-separated allowlist of origins.

## Key Design Decisions

- **Read-only throughout** — no payments, transfers, or money movement
- **Never stores full account numbers** — only last 4 digits
- **Weekend pause setting** — automated alerts pause Friday afternoon through Saturday night
- **Account nicknames** — users name their accounts; BAL checking, BAL savings work as commands
- **Mock data** — seeded with realistic demo users, accounts, transactions, and SMS logs

## Development Commands

```bash
# Run frontend
pnpm --filter @workspace/sms-banking run dev

# Run API server
pnpm --filter @workspace/api-server run dev

# Push DB schema
pnpm --filter @workspace/db run push

# Seed with mock data
pnpm --filter @workspace/scripts run seed

# Run codegen (after editing OpenAPI spec)
pnpm --filter @workspace/api-spec run codegen
```
