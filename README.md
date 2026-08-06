# Northstar

A single workspace for a career transition: plan the day, ship the project, track the search, and see whether any of it is working.

Built with React 19, TypeScript, Vite, Zustand, Recharts and Framer Motion. All data lives in the browser — no backend, no account, no network requests.

The app ships with sample content — an example roadmap, example schedule steps, and fictional companies, contacts and applications — so every screen has something to show on a first run. All of it is editable, and none of it is real.

## Getting started

```bash
npm install
npm run dev
```

Then open `http://localhost:5174`.

```bash
npm run build     # typecheck + production build
npm run preview   # serve the production build locally
```

Node 20.19+ or 22.12+ is required.

## Project structure

```
src/
├── main.tsx       Entry point
├── App.tsx        Routing
├── index.css      Design system — tokens, dark mode, typefaces, components
├── types/         The domain model, and the single source of truth for it
├── data/seed.ts   Starting data, editable in the app once loaded
├── store/         Zustand store: persistence, migration, plan-version merge
├── lib/           Pure logic, no React
│   ├── dates.ts       One definition of "today"; local-midnight parsing
│   ├── pacing.ts      Elastic scheduling — how skipped sessions shift the plan
│   ├── selectors.ts   Funnel maths, response rate, completion
│   ├── companies.ts   Company defaults and the outreach targets they seed
│   └── ui.ts          Status → colour and icon mappings
├── components/
│   ├── ui/        Card, Button, Modal, StatCard, Badge, ThemeToggle…
│   ├── layout/    Sidebar, AppLayout
│   └── charts/    Funnel, hours, weekly progress (Recharts)
└── pages/         One per section of the app
```

### How the pieces fit

`types/` defines the domain; everything else imports from it. `data/seed.ts` is one object matching that shape.

`store/` holds all state and persists it to `localStorage`. On load it merges what's saved with the seed: the plan — roadmap, goals, schedule, skill paths — is replaced whenever the seed's `planVersion` moves ahead, while anything you recorded yourself is left untouched.

`lib/` is where the logic lives, as plain functions with no React and no store access. Pages read state from the store, call into `lib/` for anything computed, and render components. Nothing in `components/` reaches into the store — data arrives as props.

## Sections

| Section | What it's for |
| --- | --- |
| **Dashboard** | The funnel at a glance against your own targets, today's blocks, weekly progress, and where the week's hours go. Export and import the whole state as JSON. |
| **Schedule** | The working day, block by block, with optional step-by-step guidance. Skip a session and its content slides to that area's next slot, stretching the plan rather than losing it. |
| **Roadmap** | Ten weeks, each with a theme, a definition of done and per-area goals. Editable and extensible, with a weekly review form. |
| **Applications** | Every application, with status, age and follow-up date. Applying to an unknown company adds it to Companies and seeds its outreach targets. |
| **Networking** | Outreach targets and their status, sorted by company. |
| **Companies** | The target list, ranked by fit and tiered A/B/C. |
| **Contributions** | The open-source path, from shortlisting a project to a merged pull request. |
| **Resources** | The skills roadmap — each skill with why it matters, a mini-project, links and ordered sessions — plus message templates. |
| **Components** | The design system as a live catalogue. |

## Data

Everything is stored in `localStorage`, scoped to the origin you open the app from. Nothing is transmitted anywhere. That means data is per browser and per device, and clearing site data erases it — **export a backup from the Dashboard regularly.**

The dev port is fixed in `vite.config.ts` for the same reason: `localStorage` is scoped to the origin, so a moving port would mean a moving data store.

## Design system

CSS custom properties drive everything, including dark mode — the toggle cycles system → light → dark. The typeface is switchable too, and one variable restyles the whole app. Each area has its own colour, so a week is readable at a glance. The **Components** page is the live catalogue for all of it.
