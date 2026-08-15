# Northstar

**[Live demo →](https://northstar-project-ruby.vercel.app/)**

A single workspace for a career transition: plan the day, ship the project, track the search, and see whether any of it is working.

React 19, TypeScript and Vite on the front; serverless functions, Prisma and PostgreSQL behind them. One deployment, one domain.

**You do not need an account to look at it.** The demo button on the sign-in screen creates a private throwaway account, already filled with fictional companies and applications, and signs you straight in. Creating a real account gives you the ten-week plan and none of the invented data.

## Getting started

```bash
npm install
cp .env.example .env      # then set DATABASE_URL and SESSION_SECRET
npx prisma migrate deploy
npx vercel dev
```

Then open `http://localhost:5174`.

`vercel dev` rather than `npm run dev`: the API is serverless functions, and Vite alone serves only the frontend.

```bash
npm run build     # generate the client, typecheck, build
npm test          # unit tests
```

Node 20.19+ or 22.12+ is required. `DATABASE_URL` can point at any PostgreSQL database; the deployment uses Neon.

## Project structure

```
api/                 Serverless functions — the whole API is five of them
├── auth/[action]    Register, sign in, sign out, session, guest, delete
├── items/           Create, edit and delete rows in any collection
├── user/[part]      Settings, weekly reviews, daily log
├── state.ts         The whole account in one request; PUT restores a backup
└── _lib/            Prisma client, sessions, validation, enum mapping

prisma/
├── schema.prisma    The data model
└── migrations/      Versioned, so the schema rebuilds from scratch

src/
├── main.tsx       Entry point
├── App.tsx        Routing and the session gate
├── index.css      Design system — tokens, dark mode, typefaces, components
├── types/         The domain model, and the single source of truth for it
├── data/seed.ts   The starting plan, and the demo content
├── store/         Zustand store, backed by the API
├── lib/           Pure logic, no React
│   ├── api.ts         The only place that talks to the API
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

`store/` holds a copy of the account's state so the interface stays instant. Every change is applied locally first and sent afterwards; a failed write says so and reloads from the server, rather than leaving the screen showing something that was never saved.

The API reads in one request and writes row by row. Every write is scoped by the session's user as well as by row id, so a guessed id matches nothing.

`lib/` is where the logic lives, as plain functions with no React and no store access. Pages read state from the store, call into `lib/` for anything computed, and render components. Nothing in `components/` reaches into the store — data arrives as props.

## Sections

| Section | What it's for |
| --- | --- |
| **Dashboard** | The funnel at a glance against your own targets, today's blocks, weekly progress, and where the week's hours go. Export a backup, restore one, or delete the account. |
| **Schedule** | The working day, block by block, with optional step-by-step guidance. Skip a session and its content slides to that area's next slot, stretching the plan rather than losing it. |
| **Roadmap** | Ten weeks, each with a theme, a definition of done and per-area goals. Editable and extensible, with a weekly review form. |
| **Applications** | Every application, with status, age and follow-up date. Applying to an unknown company adds it to Companies and seeds its outreach targets. |
| **Networking** | Outreach targets and their status, sorted by company. |
| **Companies** | The target list, ranked by fit and tiered A/B/C. |
| **Contributions** | The open-source path, from shortlisting a project to a merged pull request. |
| **Resources** | The skills roadmap — each skill with why it matters, a mini-project, links and ordered sessions — plus message templates. |
| **Components** | The design system as a live catalogue. |

## Data

Everything lives in your account in PostgreSQL. The session is a signed token in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie, so no script can read it and no other site can borrow it. Passwords are hashed with bcrypt.

Deleting your account deletes everything in it — the schema cascades, so erasure is a property of the data model rather than code that can be forgotten.

Backups export as JSON from the Dashboard and restore into the account in a single transaction.

## Design system

CSS custom properties drive everything, including dark mode — the toggle cycles system → light → dark. The typeface is switchable too, and one variable restyles the whole app. Each area has its own colour, so a week is readable at a glance. The **Components** page is the live catalogue for all of it.
