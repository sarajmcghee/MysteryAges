# Party Leader MVP

A React + TypeScript single-page app for running a "raid" style project session: define a boss objective, assign tasks to agents, resolve blockers, and monitor progress through a timeline.

## Architecture Summary

### Stack
- Vite 5 + React 18 + TypeScript
- Zustand for client-side state management
- LocalStorage persistence via a lightweight service layer

### Runtime Flow
1. `src/main.tsx` mounts `App` inside `Providers`.
2. `src/app/App.tsx` renders `RaidPage`.
3. `RaidPage` composes the core feature panels:
- Boss panel (`BossPanel`)
- Task board (`TaskBoard`)
- Agent roster (`AgentRoster`)
- Blocker panel (`BlockerPanel`)
- Event timeline (`RaidTimeline`)
- Assignment modal (`TaskAssignmentModal`)
4. All panels read/write through the shared Zustand store (`src/features/raid/state/raidStore.ts`).

### Feature Structure
- `src/features/raid/types/raid.ts`: domain types (`Boss`, `Agent`, `Task`, `RaidEvent`, `RaidState`)
- `src/features/raid/state/actions.ts`: action contract
- `src/features/raid/state/raidStore.ts`: action implementations + persistence subscription
- `src/features/raid/state/selectors.ts`: reusable selectors and derived metrics
- `src/features/raid/services/raidService.ts`: state seed + localStorage load/save
- `src/features/raid/utils/taskRules.ts`: dependency and auto-unblock rules
- `src/features/raid/components/*`: UI surfaces for operations

### State and Persistence
- Initial seeded raid state is created in `raidService`.
- Store loads from `localStorage` key `party-leader-raid-state-v1`.
- Any raid state change is persisted through `useRaidStore.subscribe`.
- Timeline events are prepended and capped at 200 entries.

## Data Model

### Boss
Represents the primary objective and current raid phase.

Key fields:
- `id`, `name`, `type`, `tier`
- `objective`, `victoryCondition`
- `mechanics[]`
- `currentPhase` (`prep | pull | execute | cleanup`)
- `enrageTimerSec?`

### Agent
Represents a worker/operator in the raid.

Key fields:
- `id`, `handle`, `role` (`tank | healer | dps | support`)
- `personality`, `skillTags[]`
- `state` (`idle | scouting | working | blocked | completed`)
- `status` (`online | offline | busy`)
- `currentTaskId?`, `needs[]`

### Task
Represents work units toward the boss objective.

Key fields:
- `id`, `title`, `description?`, `bossId`
- `assignedAgentId?`
- `status` (`todo | in_progress | blocked | done`)
- `priority` (`1 | 2 | 3`)
- `blockerReason?`
- `dependsOnTaskIds?`
- `updatedAt`

### RaidEvent
Immutable audit entries for operational visibility.

Key fields:
- `id`, `timestamp`
- `type` (`task_assigned | task_status_changed | blocker_resolved`)
- `taskId?`, `agentId?`, `note?`

### RaidState
Top-level aggregate:
- `raidId`, `boss`, `agents`, `tasks`, `events`
- `selectedTaskId?`
- `filter` (`agentId?`, `status?`, `showOnlyBlocked`)

## Core Behaviors

- Assigning a task sets agent to `working` + `busy` and emits `task_assigned`.
- Completing a task (`done`) can auto-unblock dependent blocked tasks if all dependencies are done.
- Resolving a blocker clears `blockerReason`, transitions task to `in_progress` (if assigned) or `todo` (if unassigned), and emits `blocker_resolved`.
- Progress badge is computed as `done_tasks / all_tasks`.

## Run and Test

### Prerequisites
- Node.js 18+
- npm 9+

### Install
```bash
npm install
```

### Start Dev Server
```bash
npm run dev
```

### Configure GitHub Access Gate
Create `.env.local`:
```bash
VITE_API_BASE_URL=http://localhost:8787
VITE_ALLOWED_GITHUB_LOGIN=your-github-username
VITE_AUTH_GATE_ENABLED=true
```

Required backend endpoints:
- `GET /auth/session` -> `{ authenticated: boolean, user?: { id, login, name?, avatarUrl? } }`
- `GET /auth/github/login?redirect=<url>` -> starts GitHub OAuth flow and returns to the app

The React app blocks access unless `user.login` matches `VITE_ALLOWED_GITHUB_LOGIN`.

Local-only bypass:
- Set `VITE_AUTH_GATE_ENABLED=false` in `.env.local` to skip the auth gate during local testing.
- Keep it `true` for deployed builds.

### Build Production Bundle
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Run Tests
```bash
npm run test
```

### Watch Tests
```bash
npm run test:watch
```

Note: the current scripts are configured for Vitest; if no test files exist yet, `npm run test` may report "No test files found".

## Party Leader Quick Guide

For full session operations, see `raid-session.md`.

At a glance:
1. Set the boss phase in `BossPanel`.
2. Assign unowned work via `Quick Assign` or task/agent-level assign actions.
3. Keep `Blocked` and `Unassigned` header badges near zero.
4. Resolve blockers in `BlockerPanel` with explicit resolution notes.
5. Use `RaidTimeline` to confirm every key decision is logged.

## Agent Chat Mode

### What it is
- A frontend chat client layer for agent-targeted messages.
- Implemented as:
  - `src/features/agents/services/chatService.ts`
  - `src/features/agents/hooks/useAgentChat.ts`
- Sends `POST {VITE_API_BASE_URL}/api/agents/:agentId/chat` with `{ message }`.
- Returns `{ agentId, reply, timestamp }` from the backend.

### How to use it
1. Set `VITE_API_BASE_URL` in your Vite env (for example `.env.local`).
2. Call `useAgentChat(agentId)` in a component.
3. Invoke `send(message)` and render:
- `isSending` for loading state
- `error` for failed requests
- returned `reply` payload on success

### Thread-per-agent behavior
- Request routing is per-agent via `:agentId` in the URL.
- The frontend does not currently store chat transcripts or thread state.
- Any true thread history is backend-owned (or future UI/state work).

Auth note:
- Chat requests include cookies (`credentials: include`) so your backend can enforce GitHub-authenticated access before using any API key-backed service.

For contributor details, see `docs/agent-chat-mode.md`.

## Dogma Theme Quick Tuning

- Main hero component: `src/features/raid/components/HeroDogma.tsx`
- Theme tokens and styling: `src/features/raid/components/dogma-theme.css`

Fast tweaks:
- Colors: edit `:root` vars in `dogma-theme.css` (`--dogma-bg`, `--dogma-sage`, `--dogma-forest`, `--dogma-wood`, `--dogma-line`).
- Typography: edit `--dogma-serif` and `--dogma-sans` in `dogma-theme.css`.
- Hero scale: adjust `.dogma-title` `font-size` clamp and `.dogma-hero` padding/min-height.
- Motion intensity: tune `@keyframes dogma-enter`/`dogma-float` values or disable via `prefers-reduced-motion` block.
- Reference image usage: place your Pixabay image at `public/dogma-reference.jpg` (or use another extension and update `illustrationSrc` in `HeroDogma`).

## 3D Tavern Hero

- Model asset root: `public/models/tavern/`
- Current checked-in source asset folder: `public/models/tavern/Cozy Tavern - First Floor 2/`
- Full integration notes, attribution requirements, troubleshooting, and fallback behavior:
  - `docs/tavern-hero-3d.md`
