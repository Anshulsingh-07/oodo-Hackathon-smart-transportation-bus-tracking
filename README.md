# TransitOps

TransitOps is an enterprise-grade Smart Transport Operations Platform for fleet, trip, maintenance, safety, and cost operations.

## Tech Stack

- Backend: Node.js, TypeScript, Express, MySQL (`mysql2`), JWT auth (access + refresh), RBAC, Helmet, CORS, rate limiting, `express-validator`, `multer`, `nodemailer`, `node-cron`
- Frontend: React 18, TypeScript, React Router, Axios interceptors (token attach + refresh), React Hook Form, Tailwind CSS, Recharts

## Monorepo Structure

- `apps/api` - REST API server
- `apps/web` - React frontend
- `demo_seed_data.sql` - full schema + demo data

## Prerequisites

- Node.js `>= 20`
- npm `>= 10`
- MySQL `>= 8.0`

## Installation

```bash
npm install
```

## Environment Configuration

Create app-specific env files:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### Backend Variables (`apps/api/.env`)

- `NODE_ENV`: `development` or `production`
- `PORT`: API port (default `5000`)
- `DB_HOST`: MySQL host
- `DB_PORT`: MySQL port
- `DB_USER`: MySQL username
- `DB_PASSWORD`: MySQL password
- `DB_NAME`: database name (default `transit`)
- `FRONTEND_ORIGIN`: allowed browser origin for CORS
- `JWT_ACCESS_SECRET`: secret for access tokens
- `JWT_REFRESH_SECRET`: secret for refresh tokens
- `JWT_ACCESS_TTL`: access token lifetime (e.g. `15m`)
- `JWT_REFRESH_TTL`: refresh token lifetime (e.g. `7d`)
- `SMTP_HOST`: SMTP server host
- `SMTP_PORT`: SMTP server port
- `SMTP_USER`: SMTP username
- `SMTP_PASS`: SMTP password
- `SMTP_FROM`: sender address for license alerts
- `LICENSE_CHECK_CRON`: cron expression for daily license checks

### Frontend Variables (`apps/web/.env`)

- `VITE_API_URL`: API base URL (default `http://localhost:5000/api`)

## Database Setup

`demo_seed_data.sql` creates all required schema + seed data:

- `roles`
- `users`
- `vehicles`
- `vehicle_documents`
- `drivers`
- `trips`
- `maintenance_logs`
- `fuel_logs`
- `expenses`
- `audit_log`

And also operational tables used by app runtime:

- `refresh_tokens`
- `notifications`

Run it on a fresh MySQL server:

```bash
mysql -u root -p < demo_seed_data.sql
```

## Demo Credentials (All Roles)

Password for every account: `Password123`

- Admin: `admin@transitops.local`
- Fleet Manager: `fleet@transitops.local`
- Dispatcher: `dispatch@transitops.local`
- Safety Officer: `safety@transitops.local`
- Financial Analyst: `finance@transitops.local`

## Run Locally

Start both apps:

```bash
npm run dev
```

Or run separately:

```bash
npm run dev -w transitops-api
npm run dev -w transitops-web
```

## Build

```bash
npm run build
```

## Automated Tests

API tests include:

- login flow success
- successful dispatch
- overweight cargo rejection
- expired license rejection
- double dispatch rejection

Run:

```bash
npm run test
```

## Manual QA Checklist (Condensed)

1. Login with each role and verify only allowed actions are visible.
2. Create vehicle with max load `500`, status `available`.
3. Create driver with valid unexpired license.
4. Create trip with cargo `450` and confirm accepted as `draft`.
5. Attempt trip with cargo above max and confirm backend rejects.
6. Dispatch valid trip and confirm vehicle + driver switch to `on_trip`.
7. Try second dispatch with same vehicle/driver and confirm rejection.
8. Complete trip with final odometer + fuel and confirm statuses return `available`.
9. Open maintenance for vehicle and confirm vehicle becomes `in_shop`.
10. Attempt dispatch for `in_shop` vehicle and confirm rejection.
11. Close maintenance and confirm vehicle returns `available` unless retired.
12. Check dashboard/reports metrics and CSV export output.
13. Verify notifications page shows expiring/expired license alerts.

## Security Features

- Access + refresh JWT flow
- Password hashing with `bcrypt`
- RBAC enforced in UI and server middleware
- Transactional status changes for dispatch/complete/cancel and maintenance open/close
- Helmet HTTP security headers
- CORS restricted to frontend origin
- Login and global rate limiting
- Input validation + sanitization with `express-validator`
- Centralized error handling (no stack leak to client)

## Troubleshooting

- MySQL connection errors:
   - Check `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` in `apps/api/.env`
   - Confirm MySQL service is running and reachable
- CORS errors in browser:
   - Set `FRONTEND_ORIGIN` in `apps/api/.env` to exact frontend URL (`http://localhost:5173`)
- Login fails for demo users:
   - Re-run `demo_seed_data.sql`
   - Confirm API is reading the same MySQL database name configured in `.env`
- SMTP not configured:
   - License emails are skipped if SMTP vars are empty
   - In-app notifications still work