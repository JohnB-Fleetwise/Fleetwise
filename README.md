# FleetWise

FleetWise is a fleet-tracking SaaS platform for small delivery and service businesses running 5–50 vehicles — local couriers, last-mile delivery services, food and beverage distributors, and trade contractors. It gives managers real-time visibility into every vehicle on a live map, plus the tools to manage drivers, deliveries, vehicles, maintenance, and billing — all from a clean, responsive dashboard that works on desktop and mobile. No complex setup and no training required: sign up, add your vehicles, and start tracking.

## Features

- **Live map** — every vehicle on an interactive map (Leaflet + OpenStreetMap) with driver status at a glance
- **Live tracking** — drivers' real-time geolocation feeds into the dashboard from the driver view
- **Deliveries** — create, assign, and edit deliveries with pickup/drop-off addresses, scheduling, priority, order numbers, and customer details
- **Drivers** — manage driver records, licenses, ratings, and clock in/out status; drivers get a dedicated role-based view
- **Vehicles** — vehicle registry with odometer, fuel, insurance/registration expiry, and driver assignment
- **Maintenance** — track maintenance and prevent vehicles from being on active deliveries while in the shop
- **Reports** — live fleet analytics dashboard with delivery and fleet metrics
- **Billing** — Starter and Professional subscription plans with free-trial tracking and Stripe payment links
- **In-app messaging** — dispatch-to-driver messaging built in
- **Drive-time ETAs** — real drive-time estimates via the Google Maps Distance Matrix API (when configured)

## Tech Stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript** (strict mode)
- **PostgreSQL on Neon** (serverless) with **Drizzle ORM**
- **NextAuth** (credentials authentication)
- **Leaflet + OpenStreetMap** for maps (`react-leaflet`)
- **Google Maps Distance Matrix API** for optional drive-time ETAs
- **Stripe** for billing and payment links
- **npm workspaces** monorepo, deployed on **Vercel**

## Monorepo Structure

```text
fleetwise/
├── apps/
│   ├── dashboard/   # Next.js web dashboard (App Router, Tailwind, API routes)
│   └── mobile/      # React Native (Expo) driver app
└── packages/
    └── shared/      # Shared types, validation, and constants
```

## Prerequisites

- **Node.js 18+**
- **npm**

## Getting Started

```bash
# 1. Install all workspace dependencies
npm install

# 2. Configure environment variables (see table below)
#    Create apps/dashboard/.env.local with the required values.

# 3. Run the web dashboard in development
npm run dev

# 4. Build the dashboard for production
npm run build
```

Additional workspace scripts:

```bash
npm run typecheck        # Type-check all workspaces
npm run lint             # Lint all workspaces
npm run dev:dashboard    # Dashboard dev server (same as npm run dev)
npm run dev:mobile       # Expo driver app
```

## Environment Variables

Create `apps/dashboard/.env.local` (or set the variables in your hosting environment). A template is provided in [`apps/dashboard/.env.example`](apps/dashboard/.env.example).

| Variable              | Required | Description                                                                                                                    |
| --------------------- | :------: | ------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`        |   Yes    | PostgreSQL connection string (Neon serverless). Used by the Drizzle/Neon database layer; the app will not start without it.    |
| `NEXTAUTH_SECRET`     |   Yes*   | Secret used by NextAuth to sign session cookies and JWTs. A development fallback exists, but set a strong value in production. |
| `GOOGLE_MAPS_API_KEY` |    No    | Google Maps Distance Matrix API key. Enables real drive-time ETAs; when unset, ETAs are unavailable (the app logs a warning).  |

\* Required for production.

## Database Schema & Migrations

The schema is **self-migrating**: there are no migration files to run. On boot, `ensureSchema()` — defined in [`apps/dashboard/src/lib/db.ts`](apps/dashboard/src/lib/db.ts) — issues `CREATE TABLE IF NOT EXISTS` statements for every table (users, vehicles, drivers, deliveries, fleet_settings, messages, and more). The Drizzle schema for the entire app lives in that single file; editing it and restarting is all that's needed to add tables or columns.

## Deployment

The app **auto-deploys from `main` on Vercel**. Push to `main` and the production build runs automatically. For local production checks, use `npm run build` followed by `npm run start` (inside `apps/dashboard`).

## Scripts

| Command                     | Description                                      |
| --------------------------- | ------------------------------------------------ |
| `npm install`               | Install all workspace dependencies               |
| `npm run dev`               | Start the dashboard dev server (port 3000)       |
| `npm run build`             | Build the dashboard for production               |
| `npm run typecheck`         | Type-check all workspaces                        |
| `npm run lint`              | Lint all workspaces                              |
| `npm run dev:dashboard`     | Dashboard dev server (alias)                     |
| `npm run dev:mobile`        | Expo driver app                                  |
