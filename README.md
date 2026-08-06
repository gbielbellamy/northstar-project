# Northstar

*It's your path, and yours alone. Others may walk it with you, but no one can walk it for you.*

A single workspace for a career transition: plan the day, ship the project, track the search, and see whether any of it is working.

Built with React 19, TypeScript, Vite, Zustand, Recharts and Framer Motion. All data lives in the browser — no backend, no account, no network requests.

> This is also the portfolio project itself. The ten-week roadmap inside the app describes how this codebase grows: PostgreSQL, authentication, testing, CI/CD and deployment. The app tracks its own construction.

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints — `http://localhost:5174`. The port is fixed in `vite.config.ts`, since `localStorage` is scoped to the origin and a moving port would mean a moving data store.

```bash
npm run build     # typecheck + production build
npm run preview   # serve the production build locally
```

Node 20.19+ or 22.12+ is required.

## What's inside

| Section | What it's for |
| --- | --- |
| **Dashboard** | The funnel at a glance, graded against your own targets: applications this week, response rate, live conversations, follow-ups due. Today's blocks, a weekly progress ring, and where the week's 40 hours actually go. |
| **Schedule** | The working day, 09:00–17:45 — eight hours of work, 45 minutes of break. Each block says what finishing that one sitting looks like, with optional step-by-step guidance; the week's target lives in Roadmap. Skip a session and its content slides to that area's next slot, stretching the plan rather than losing it. Mark a day as an event and it tracks the hours owed and when you'll make them up. |
| **Roadmap** | Ten weeks, each with a theme and a definition of done, plus the working rule spelled out step by step — open the issue, branch, commit, PR, review, record the evidence, then mark it done. Editable, extensible, with a weekly review form. |
| **Applications** | Every application across both tracks — direct engineering roles and bridge roles in support, solutions, implementation and QA — logged with status, age, follow-up date and resume version. Filters, search and sorting. Applying to a company that isn't on the list adds it to Companies and seeds its outreach targets. |
| **Networking** | Outreach targets and their status, sorted by company. Follow-ups and message angle per contact. |
| **Companies** | The target list ranked by fit, tiered A/B/C. Adding a company creates its two networking targets automatically. |
| **Contributions** | The open-source path: eight steps from shortlisting a project to a merged PR, with where to find issues and a tracker for each contribution's stage. |
| **Resources** | The skills roadmap — around thirty technologies, each with why it matters, a mini-project, real links and an ordered set of sessions sized to one Learning block — plus message templates you can copy and rewrite. |
| **Components** | The design system: a live typeface picker, colour tokens, area colours, typography, buttons, badges, forms, progress, motion. |

## The week

A fixed shape, so the decision is made once rather than every morning.

| | Mon | Tue | Wed | Thu | Fri |
| --- | --- | --- | --- | --- | --- |
| 09:00–12:45 | Job Search | Job Search | Job Search | Job Search | Job Search |
| 12:45–13:15 | Lunch | Lunch | Lunch | Lunch | Lunch |
| 13:15–15:30 | Project | Contributions | Project | Contributions | Project |
| 15:30–15:45 | Break | Break | Break | Break | Break |
| 15:45–17:00 | Learning | Algorithms | Learning | Algorithms | Learning |
| 17:00–17:45 | English | English | English | English | English |

Saturday morning carries Portfolio (10:00–11:00) and the weekly review (11:00–12:00). Sunday is off entirely. Rest counts.

**Roughly 40 hours a week:** Job Search 18¾ · Project 6¾ · Contributions 4½ · Learning 3¾ · English 3¾ · Algorithms 2½ · Portfolio 1 · Review 1

Networking has no fixed block — outreach happens alongside each application. Add a block on the day when a call or an event actually lands.

## Weekly targets

Every number here is editable from the Dashboard — a target you can't move is one you'll start ignoring.

- **Applications**, split between direct engineering roles and bridge roles in support, solutions, implementation and QA. Response rate is the number that says whether the targeting works; volume isn't.
- **Personalised outreach**, one message per application, to a recruiter or someone on the team.
- **One open-source contribution in flight.** Documentation and test fixes count.
- **A chapter of algorithms practice a week**, in the order that serves an interview rather than the order it's printed.
- **Interview English every day, on camera** — behavioural questions, connectors that make an answer sound structured, narrating and defending a technical decision.

## Data

Everything is stored in `localStorage` under `career-transition-os`, scoped to the origin you open the app from. Nothing is transmitted anywhere.

That means data is per browser and per device, and clearing site data erases it. **Export a backup from the Dashboard regularly** — the JSON round-trips through Import.

The app ships with **sample content** — an example roadmap, example schedule steps, and fictional companies, contacts and applications — so that every screen has something to show on first run. All of it is editable, and none of it is real.

The plan itself (roadmap, goals, schedule, skill paths) carries a `planVersion`. When the seed's version moves ahead of what's saved, the plan is replaced on load — deliberate, since keeping an old timetable after a rewrite would keep the thing that was replaced. Everything you actually recorded — applications, contacts, companies, templates, event days, contributions — is yours and survives untouched.

## Project structure

```
src/
├── assets/logos/  Brand logos simple-icons doesn't carry (drop a file in, matched by name)
├── components/
│   ├── ui/        Card, Button, StatusSelect, StatCard, SkillIcon, FontPicker, ThemeToggle…
│   ├── layout/    Sidebar, AppLayout
│   └── charts/    Funnel, Hours, WeekProgress (Recharts)
├── data/seed.ts   Starting data — editable in the app once loaded
├── lib/
│   ├── dates.ts   One definition of "today"; local-midnight parsing
│   ├── selectors.ts  Funnel maths, response rate, completion
│   └── ui.ts      Status → colour/icon mappings
├── pages/         One per section
├── store/         Zustand store with persistence, migration and plan-version merge
├── types/         The domain model
└── index.css      Design system (tokens, dark mode, typefaces, components)
```

## Design system

CSS custom properties drive everything, including dark mode — a toggle cycles system → light → dark, and the app follows your OS theme when left on system. The typeface is switchable too (Inter, Manrope, Plus Jakarta Sans, Figtree, Space Grotesk), one variable restyles the whole app. The **Components** page is the live catalogue for both.

Each area has its own colour, so a week is readable at a glance: Project (purple), Learning (blue), Algorithms (red), Job Search (green), Networking (amber), Contributions (teal), Interview Prep (pink), Portfolio (cyan), Review (violet).

Technology logos in Resources come from `simple-icons`, imported one at a time rather than as a namespace import — pulling the whole package once inflated the bundle from ~1MB to ~6.6MB.

## What's next

Week 11 isn't written yet, and the roadmap lets you add it. The obvious candidate: an assistant over your own data — *"which companies owe me a follow-up?"*, *"what's my response rate for support roles versus SWE roles?"*. That needs the database and API from weeks 2–4 to exist first, which is why it isn't week 1.
