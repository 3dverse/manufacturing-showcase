# Manufacturing Showcase

A manufacturing digital twin built on [3dverse](https://3dverse.com/). It connects enterprise systems (ERP, MES, EAM, WMS, QMS, APS) to a real-time 3D environment, giving operations teams a single place to monitor factory health, trace order impact, and act on incidents.

**Live demo:** https://manufacturing.3dverse.com/

## What it does

The app lets you navigate a 3D factory floor at any level — site, area, production line, cell, or machine — with live operational context pulled from connected enterprise systems. Key capabilities:

- **OEE monitoring** — overall equipment effectiveness at every scope (factory, area, cell)
- **Manufacturing & work orders** — active orders, schedule risk, and production timelines visible in context
- **SCADA event alerts** — machine downtime events surface in real time with production impact and linked records
- **Cross-system correlation** — trace a downtime event through to the affected production order, sales order, and customer
- **Operational timeline** — scroll through events, downtime bands, and work order windows; click any event for details
- **Multi-user collaboration** — invite teammates into the same session with QR code or link; all users share synchronized state
- **Incident reports** — download a PDF report for any SCADA incident

### Guided scenarios

The app ships with step-by-step walkthroughs that demonstrate specific operational workflows:

| Scenario | Summary |
|---|---|
| **Guided Mode** | Business-oriented tour of the digital twin: connected systems, factory health indicators, floor navigation, timeline, and collaboration |
| **Corrective Maintenance** | A machine goes down mid-shift — trace the alert through to the affected customer delivery and create a corrective work order |
| **Predictive Maintenance** | A declining OEE trend triggers a predictive alert before failure — schedule a maintenance work order to protect production continuity |

## Tech stack

| Layer | Libraries |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v4 |
| 3D runtime | 3dverse Livelink, Livelink React |
| Backend | Express v5, OpenAPI Backend, openapi-generator |
| Data & state | React Query, Zustand |
| Charts | visx, d3 |
| Flow diagrams | xyflow (BOM view) |

## Getting started

### Install dependencies

```sh
npm install
```

### Start the development server

```sh
npm run dev
```

The app runs at http://localhost:5173/ and the API server at http://localhost:3000/.

The prebuild step (`npm run prebuild`) runs automatically before `dev` and `build`. It generates TypeScript types and client libraries from the OpenAPI specs in `server/spec/`.

### Other scripts

| Command | Description |
|---|---|
| `npm run build` | Production build (app + server) |
| `npm run typecheck` | Run TypeScript checks across app and server |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run storybook` | Component explorer on port 6006 |

## Project structure

```
src/
  components/       # UI components, organized by feature
  content/          # Static content: scenarios, routes, icons, enums
  contexts/         # React contexts (factory, selection, hover, …)
  core/             # Domain logic (OEE, correlation, projection, scope)
  hooks/            # Data-fetching and derived-state hooks
  pages/            # Top-level page components
  store/            # Zustand stores
server/
  spec/             # OpenAPI specs for connected systems (ERP, MES, EAM, …)
  libs/             # Generator config per system
```
