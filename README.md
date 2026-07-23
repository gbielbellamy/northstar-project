# Career Transition OS

A single workspace for a career transition: plan the day, ship the project, track the search, and see whether any of it is working.

Built with React 19, TypeScript, Vite, Zustand, Recharts and Framer Motion. All data lives in the browser — no backend, no account, no network requests.

> This is also the portfolio project itself. The ten-week roadmap inside the app describes how this codebase grows: PostgreSQL, authentication, testing, CI/CD and deployment. The app tracks its own construction.

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints — normally `http://localhost:5173`.

```bash
npm run build     # typecheck + production build
npm run preview   # serve the production build locally
```

Node 20.19+ or 22.12+ is required.

## What's inside

| Section | What it's for |
| --- | --- |
| **Dashboard** | The funnel at a glance: applications sent, response rate, live conversations, follow-ups due. Today's blocks and a weekly progress ring. |
| **Schedule** | The working day, 09:00–17:00 with a 30-minute lunch. Each block shows the week's real goal for that area. Tick sessions off as you do them. |
| **Roadmap** | Ten weeks, each with a theme and a definition of done. Editable, extensible, with a weekly review form. |
| **Applications** | Every role you've applied to: status, age, follow-up date, resume version. Filters, search and sorting. |
| **Networking** | Outreach targets, two per company — a peer and a hiring influencer. Status, follow-ups and message angle. |
| **Companies** | The target list ranked by fit. Adding a company creates its two networking targets automatically. |
| **Resources** | The skills roadmap, and message templates you can copy and rewrite. |
| **Components** | The design system: colour tokens, area colours, typography, buttons, badges, forms, progress, motion. |

## The week

A fixed shape, so the decision is made once rather than every morning.

| | Mon | Tue | Wed | Thu | Fri |
| --- | --- | --- | --- | --- | --- |
| 09:00–13:00 | Project | Project | Project | Project | Project |
| 13:00–13:30 | Lunch | Lunch | Lunch | Lunch | Lunch |
| 13:30–15:00 | Learning | Learning | Learning | Learning | Learning¹ |
| 15:00–16:30 | Job Search | Networking | Job Search | Networking | Job Search¹ |
| 16:30–17:00 | English | English | English | English | Portfolio + Review¹ |

¹ Friday runs shorter blocks to fit the portfolio wrap-up and the weekly review.

**37.5 hours a week:** Project 20 · Learning 7 · Job Search 4 · Networking 3 · Interview Prep 2 · Portfolio 1 · Review 0.5

Weekends are optional. Rest counts.

## Weekly targets

- **5 tailored applications.** Not fifteen generic ones — generic applications don't get read, so they cost time and return nothing. Response rate is the number that tells you whether the targeting works.
- **6 personalised messages and 2 follow-ups.** Peer first, hiring influencer second. Ask for advice, never a referral, in a first message.
- **1 informational call.**
- **2 hours of English, out loud.** Thirty minutes a day, Monday to Thursday: explain what you built that day, recorded, unscripted. The replay is where the fluency comes from.

## Data

Everything is stored in `localStorage` under `career-transition-os`, scoped to the origin you open the app from. Nothing is transmitted anywhere.

That means data is per browser and per device, and clearing site data erases it. **Export a backup from the Dashboard regularly** — the JSON round-trips through Import.

## Project structure

```
src/
├── components/
│   ├── ui/        Card, Button, Badge, Modal, Field, Checkbox, StatCard, Progress…
│   ├── layout/    Sidebar, AppLayout
│   └── charts/    Funnel, Hours, WeekProgress (Recharts)
├── data/seed.ts   Starting data — editable in the app once loaded
├── lib/
│   ├── dates.ts   One definition of "today"; local-midnight parsing
│   ├── selectors.ts  Funnel maths, response rate, completion
│   └── ui.ts      Status → badge variant mappings
├── pages/         One per section
├── store/         Zustand store with persistence
├── types/         The domain model
└── index.css      Design system (tokens, dark mode, components)
```

## Design system

CSS custom properties drive everything, including dark mode — the app follows your OS theme with no JavaScript involved. The **Components** page is the live catalogue.

Each of the seven areas has its own colour, so a week is readable at a glance: Project (purple), Learning (blue), Job Search (green), Networking (amber), Interview Prep (pink), Portfolio (cyan), Review (violet).

## What's next

Week 11 isn't written yet, and the roadmap lets you add it. The obvious candidate: an assistant over your own data — *"which companies owe me a follow-up?"*, *"what's my response rate for support roles versus SWE roles?"*. That needs the database and API from weeks 2–4 to exist first, which is why it isn't week 1.
