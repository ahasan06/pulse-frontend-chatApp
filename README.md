# Pulse Chat

Real-time chat application built for the Pulse frontend assignment (Part 1). Phone-based login, direct and group conversations, live message updates, and an AI-assisted compose layer.

## Live demo

**Chat app:** https://pulse-frontend-chat-app.vercel.app/

**Landing page (Part 2):** https://pulse-landing-page-lemon.vercel.app/

## Repository

https://github.com/ahasan06/pulse-frontend-chatApp

Related repo: [pulse-landing-page](https://github.com/ahasan06/pulse-landing-page)

---

## Part 1 — Features

| Requirement | Implementation |
| --- | --- |
| Login (phone + name, auto-register) | `POST /auth/login` — new numbers register automatically |
| Start a conversation | Search by name or phone, then start a direct chat |
| Group conversations | Create groups with multiple participants; add/remove members |
| Message list | Full history with sent vs received styling and timestamps |
| Send messages | Composer with validation — empty messages cannot be sent |
| Real-time updates | Socket.io `message:new` and `conversation:updated` events |
| Loading / empty / error states | Spinners, empty states, and retryable error UI throughout |
| Auto-scroll | Sticks to the latest message unless the user scrolls up; jump-to-bottom button when away from the bottom |

### Bonus features

- **AI compose** — optional Bangla→English and grammar refinement before sending (OpenRouter via Vercel serverless routes)
- **In-message translation** — translate received messages for reading
- **In-thread message search** — find text inside the active conversation
- **Notification bell** — unread messages from other conversations while you are in a thread
- **Members directory** — browse all users when search is empty (`GET /users/search` with no `q`)
- **Optimistic send + retry** — failed sends stay visible with a retry action
- **Dark / light theme** — persisted locally

---

## API documentation

Custom API docs live in [`docs/API.md`](docs/API.md).

They were written **before** implementation by inspecting the live API and the official Swagger spec (which documents requests only). The doc covers endpoints, auth, response shapes, Socket.io events, client normalization notes, and observed API quirks.

Official Swagger: https://frontend-task-chatapp.onrender.com/docs/

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | React 19 + Vite 8 |
| Language | TypeScript |
| Routing | React Router 7 |
| State | Zustand |
| HTTP | Axios |
| Real-time | Socket.io client |
| Forms / validation | React Hook Form + Zod |
| Styling | Tailwind CSS 4 |
| AI (optional) | OpenRouter — Vercel serverless functions in `api/ai/` |
| Deploy | Vercel |

---

## Getting started

### Prerequisites

- Node.js 20+
- npm

### Install and run

```bash
git clone https://github.com/ahasan06/pulse-frontend-chatApp.git
cd pulse-frontend-chatApp
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173

### Environment variables

Copy `.env.example` to `.env`:

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | REST base URL (default: `https://frontend-task-chatapp.onrender.com/api`) |
| `VITE_SOCKET_URL` | Socket.io origin (default: `https://frontend-task-chatapp.onrender.com`) |
| `OPENROUTER_API_KEY` | Optional — enables AI compose and translation in local dev via the Vite plugin |

AI features are optional. Without `OPENROUTER_API_KEY`, the rest of the chat app works normally.

### Scripts

```bash
npm run dev      # local development
npm run build    # production build
npm run preview  # preview production build
npm run lint     # oxlint
```

---

## Project structure

```
src/
├── components/     # UI, layout, inbox, thread, dialogs
├── hooks/          # socket, auto-scroll, debounced search
├── lib/            # API client, normalization, dates, phone helpers
├── pages/          # login, chat
├── schemas/        # Zod form schemas
├── store/          # Zustand stores (auth, chat, notifications, AI compose)
└── types/          # API and client types
docs/
└── API.md          # Part 1 API documentation
api/ai/             # Vercel serverless routes for OpenRouter
```

---

## Part 3 — Thought process write-up

### Part 1 — Architecture and trade-offs

**Why Vite instead of Next.js for the chat app**

The assignment allows React or Next.js. I chose **Vite + React** for the chat client because it is a single-page app with no SSR requirement. That keeps the bundle lean, makes Socket.io lifecycle management straightforward, and avoids mixing client-only real-time logic with a server framework.

**State: Zustand over Redux or React Query alone**

Conversations, messages, unread counts, and send status change together in tight loops (socket event → inbox reorder → active thread append). Zustand gives a small, explicit store without boilerplate. REST calls stay in store actions; the socket hook pushes into the same store so REST and realtime share one source of truth.

**API layer: normalize early**

The upstream API uses inconsistent envelopes (`{ data: [] }` vs raw arrays), different participant shapes for direct vs group threads, and socket payloads that differ from REST (`id` vs `_id`, epoch ms vs ISO dates). A dedicated `lib/api.ts` + `lib/message.ts` normalization layer keeps components unaware of those quirks. Trade-off: more upfront typing work, but fewer bugs in the message list and inbox.

**Real-time: socket-first, REST for send**

Messages are sent via REST (`POST /messages`) and appended from Socket.io (`message:new`). The store de-duplicates by message id so a REST response and a socket event for the same message do not create duplicates. `conversation:updated` triggers an inbox refresh for group changes.

**Auto-scroll**

A custom `useAutoScroll` hook tracks whether the user is near the bottom (~96px). New messages only force-scroll when the user has not scrolled up; otherwise a “jump to latest” control appears.

**Forms: Zod + React Hook Form**

Login, group creation, and the composer all use schema validation so empty messages and invalid phone input are blocked before hitting the API.

**AI compose (bonus)**

AI runs through Vercel serverless routes (`/api/ai/refine`, `/api/ai/translate`) so the OpenRouter key never ships to the browser. Locally, a Vite dev plugin proxies the same routes. This was added as a practical edge-case helper for bilingual messaging, not as a core assignment requirement.

### Part 2 — Landing page design (see also the landing repo)

The landing page lives in a separate Next.js repo for clearer deployment boundaries. Design direction, SEO, and motion choices are documented in [pulse-landing-page/README.md](https://github.com/ahasan06/pulse-landing-page/blob/main/README.md).

### AI tool usage

| Tool | Used for | What I kept vs changed |
| --- | --- | --- |
| **Claude** | Architecture decisions (Vite vs Next.js, Zustand, API normalization, socket strategy), landing copy tone, section structure, SEO/AEO metadata patterns, `llms.txt` content | Reviewed and applied the choices that fit the assignment; edited copy for voice and length |
| **Cursor** | Building the project — components, stores, API client, socket wiring, layouts, deployment setup, commit naming, bug fixing | Implementation work in the IDE; did not use it for high-level architecture planning |
| **ChatGPT** | Reference images for visual direction (layout mood, hero composition) | Final UI, colors, typography, and components were designed and coded manually; reference images were inspiration only |

### What I would improve with more time

- End-to-end tests for login → start chat → send → receive over socket
- Virtualized message list for very long threads
- Offline / reconnect queue for pending sends
- Unified design tokens shared between the chat app and landing page repos
- Stricter error boundaries and structured logging for production

### API issues encountered

| Issue | Handling |
| --- | --- |
| Swagger documents requests only; response shapes differ live | Documented live responses in `docs/API.md`; typed per endpoint |
| `POST /auth/login` ignores a new `name` when the phone already exists | Display `user.name` from the response, not the form input |
| `GET /api/health` returns 404; health is at `/health` on the origin | Not used in the UI; noted in API docs |
| Inconsistent response envelopes | No generic `ApiResponse<T>` — separate types per route |
| Direct threads use `participant`; groups use `participants` + `name` | Discriminate on `conversation.type` |
| `lastMessage` can be `{}` | Guard with `lastMessage?.text` before rendering previews |
| Search returns the current user | Filter out `auth.user._id` client-side |
| Socket `message:new` uses `id` + epoch ms; REST uses `_id` + ISO | `normalizeMessage()` before store insertion |
| Create-conversation returns participant ids; list returns populated users | Normalized in the API layer |

Full detail: [`docs/API.md` — Observed quirks](docs/API.md#observed-quirks-for-the-write-up).

---

## License

Private assignment submission.
