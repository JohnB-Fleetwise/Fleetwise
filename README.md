# FleetWise

A modern fleet management SaaS that helps delivery and service businesses cut costs and boost efficiency through real-time GPS tracking, route optimization, fuel and maintenance management, and actionable analytics — all in one integrated platform.

## Project Structure

```
fleetwise/
├── packages/
│   └── shared/         # Shared types, validation, constants
├── apps/
│   ├── dashboard/      # Next.js web dashboard (App Router + Tailwind)
│   └── mobile/         # React Native (Expo) driver app
```

## Getting Started

```bash
# Install all dependencies
npm install

# Start the web dashboard
npm run dev:dashboard

# Type-check everything
npm run typecheck
```

## Tech Stack

- **Monorepo:** npm workspaces
- **Language:** TypeScript (strict mode)
- **Web Dashboard:** Next.js 15 (App Router), Tailwind CSS
- **Mobile App:** React Native (Expo)
- **Maps:** Leaflet + OpenStreetMap (planned)
