# SafeReach

**Find Safety. Reach Shelter. Stay Safe.**

SafeReach is a disaster-response prototype that brings shelter listings, reported capacity, facilities, emergency contact guidance, and simulated alerts into one responsive application. All starter shelter and alert data is for demonstration only.

## Problem

During severe weather or other emergencies, people may not know where shelter is available, what facilities are listed, or how to get directions. SafeReach makes that information easier to browse in one place.

## Solution

SafeReach provides a searchable shelter network, map-based exploration, capacity details, community condition reports, a transparent rule-based shelter match, emergency guidance, notification controls, and a demo operations dashboard.

## Features

- Shelter search and status/facility filters
- Shelter detail pages with capacity, amenities, contact information, and external directions
- OpenStreetMap-based map display
- Rule-based Smart Match that explains its recommendation
- Demo alert and notification history
- Emergency guidance and India-specific emergency numbers
- Shelter reports and operations dashboard
- Responsive desktop and mobile layouts
- Clear warning that demo data and routes are not official or verified

## Technology

- React, TypeScript, Vite, Tailwind CSS
- Express 5 API
- PostgreSQL with Drizzle ORM
- OpenAPI-first generated API hooks and Zod validation
- Leaflet and OpenStreetMap

## Architecture

```text
React frontend → Express API → PostgreSQL
                      ↓
              Rule-based matching
                      ↓
        Leaflet / OpenStreetMap tiles
```

The provided Supabase publishable key is not enough to create the database schema or safely authorize administrative writes. No Supabase connection was attached to this project, so the working demonstration currently uses the Replit-provided PostgreSQL database. The OpenAPI contract and database schema are kept separate so the persistence layer can be migrated after a properly authorized Supabase setup with Row Level Security and admin authentication.

## Installation

```bash
pnpm install
pnpm --filter @workspace/api-spec run codegen
pnpm --filter @workspace/db run push
```

`DATABASE_URL` is supplied by the Replit project and should not be set manually.

## Running

Start both configured workflows in Replit:

- API Server: `pnpm --filter @workspace/api-server run dev`
- SafeReach web app: `pnpm --filter @workspace/safereach run dev`

The API is available under `/api`. The web app calls it through the shared project routing.

## Demo flow

1. Open SafeReach and browse the ten seeded Andhra Pradesh demo shelters.
2. Open Operations and change shelter capacity or facilities.
3. Trigger the clearly labeled demo emergency.
4. Review the generated notification and alert history.
5. Compare available shelters and open directions in an external map provider.
6. Submit a shelter report and review it in Operations.

## Recommendation algorithm

Smart Match is rule-based, not AI. It combines distance, available capacity, availability status, and requested facilities. It prioritizes open shelters, gives credit for medical support, food, water, and accessibility, and reduces the score as distance increases. The result explains which factors matched. It does not assess road conditions or guarantee a safe route.

## Safety and privacy

SafeReach is a prototype developed for demonstration purposes. Starter locations, availability, facilities, and alerts are simulated. Do not use them as operational emergency information. During a real emergency, follow official disaster-management instructions and contact emergency services. Directions are supplied by third-party map providers and are not verified as safe.

The demonstration does not require an account or store a visitor's precise location on the server. Admin actions update shared demonstration data and are not protected by production administrator authentication; do not connect this build to real shelter operations without adding authentication and authorization.

## Future enhancements

- Connect a verified shelter and disaster-information source
- Configure Supabase with server credentials, database schema, and RLS
- Add authenticated administrator roles
- Add verified road condition and route-safety data
- Add robust offline caching and installable PWA support
