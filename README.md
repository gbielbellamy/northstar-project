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

Then open the URL Vite prints — normally `http://localhost:5173`.

```bash
npm run build     # typecheck + production build
npm run preview   # serve the production build locally
```

Node 20.19+ or 22.12+ is required.

## What's inside

| Section | What it's for |
| --- | --- |
| **Dashboard** | The funnel at a glance, graded against your own targets: applications this week, response rate, live conversations, follow-ups due. Today's blocks, a weekly progress ring, and where the week's 40 hours actually go. |
| **Schedule** | The working day, 09:00–17:45 — eight hours of work, 45 minutes of break. Each block says what finishing that one sitting looks like; the week's target lives in Roadmap. Mark a block done, or mark a day as an event (an interview, a technical blocker, a networking meet-up) and it tracks the hours owed and when you'll make them up. |
| **Roadmap** | Ten weeks, each with a theme and a definition of done, plus the working rule spelled out step by step — open the issue, branch, commit, PR, review, record the evidence, then mark it done. Editable, extensible, with a weekly review form. |
| **Applications** | Nine tailored applications a week — four direct (Software/Full-Stack Engineer), five bridge roles — logged with status, age, follow-up date, resume version. Filters, search and sorting. |
| **Networking** | Six contacts a week. Status, follow-ups and message angle per contact. |
| **Companies** | The target list ranked by fit, tiered A/B/C. Adding a company creates its two networking targets automatically. |
| **Contributions** | The open-source path: eight steps from shortlisting a project to a merged PR, with where to find issues and a tracker for each contribution's stage. Gets its own slot in the timetable from week 5. |
| **Resources** | The skills roadmap — around thirty technologies, each with why it matters, a mini-project, real links and an ordered set of sessions sized to one Learning block — plus message templates you can copy and rewrite. |
| **Components** | The design system: a live typeface picker, colour tokens, area colours, typography, buttons, badges, forms, progress, motion. |

## The week

A fixed shape, so the decision is made once rather than every morning.

| | Mon | Tue | Wed | Thu | Fri |
| --- | --- | --- | --- | --- | --- |
| 09:00–12:45 | Project | Project | Project | Project | Project |
| 12:45–13:15 | Lunch | Lunch | Lunch | Lunch | Lunch |
| 13:15–15:30 | Job Search | Learning | Learning | Job Search | Portfolio |
| 15:30–15:45 | Break | Break | Break | Break | Break |
| 15:45–17:00 | Networking | Job Search | Algorithms | Networking | Contributions¹ / Review |
| 17:00–17:45 | English | English | English | English | English |

¹ From week 5 — before that, Friday afternoon stays Portfolio.

**40 hours a week:** Project 18¾ · Job Search 5¾ · Learning 4½ · English 3¾ · Networking 2½ · Portfolio/Contributions 2¼ · Algorithms 1¼ · Review 1¼

Sunday carries one optional block — a shop-window review of the README, portfolio links, LinkedIn and GitHub. Saturday is free. Rest counts.

## Weekly targets

- **9 tailored applications** — 4 direct (Software/Full-Stack Engineer), 5 bridge (support, solutions, implementation, QA). Three sessions a week: search first, shortlist from both tracks, apply to the best three. Response rate is the number that tells you whether the targeting works, not volume.
- **6 personalised messages.** Rewritten each time — a message that could have gone to fifty companies reads like it was.
- **One open-source contribution in flight**, from week 5. Documentation and test fixes count.
- **A CTCI chapter a week** in Algorithms, in the order that serves an interview rather than the order it's printed.
- **45 minutes of English a day, on camera** — not general conversation, specifically job-interview English: behavioural questions, connectors that make an answer sound structured, narrating and defending a technical decision, and a full mock loop by week 10.

## Data

Everything is stored in `localStorage` under `career-transition-os`, scoped to the origin you open the app from. Nothing is transmitted anywhere.

That means data is per browser and per device, and clearing site data erases it. **Export a backup from the Dashboard regularly** — the JSON round-trips through Import.

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
