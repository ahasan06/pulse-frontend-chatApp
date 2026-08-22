# Chat API

Version `1.0.0`. Documented from the live deployment and the official request-only OpenAPI spec.

The upstream Swagger file documents **requests only**. Response bodies, status codes, and inconsistencies below were captured from live calls unless marked **inferred**.

Official spec: [https://frontend-task-chatapp.onrender.com/docs/](https://frontend-task-chatapp.onrender.com/docs/)

---

## Pulse client — what this app uses

Coverage for the [pulse-frontend-chatApp](https://github.com/ahasan06/pulse-frontend-chatApp) implementation. “Wrapped” means the method exists in `src/lib/api.ts` but nothing in the UI calls it yet.

### REST endpoints

| Endpoint | Used | Where / notes |
| --- | --- | --- |
| `POST /auth/login` | **Yes** | Login page → `auth-store.login()` |
| `GET /auth/me` | **Yes** | Session restore on app load → `auth-store.restoreSession()` |
| `GET /users/search?q=` | **Yes** | Start chat, add members, `useUserSearch` (debounced, multi-variant name search) |
| `GET /users/search` (no `q`) | **Yes** | All members directory → `chatApi.listUsers()` in `members-directory.ts` |
| `GET /conversations` | **Yes** | Inbox list → `chat-store.loadConversations()` |
| `POST /conversations` | **Yes** | Start / open direct chat → `chat-store.startDirectChat()` |
| `POST /conversations/group` | **Yes** | New group dialog → `chat-store.createGroupChat()` |
| `POST /conversations/{id}/participants` | **Yes** | Add group members → `chat-store.addGroupMembers()` |
| `DELETE /conversations/{id}/participants/{userId}` | **Yes** | Admin removes member, or member leaves (self id) → `removeGroupMember()` / `leaveGroup()` |
| `POST /conversations/{id}/admins` | **No** | Wrapped as `chatApi.promoteAdmin()` — admins are **displayed** in the members dialog but never promoted via API |
| `PATCH /conversations/{id}` | **No** | Wrapped as `chatApi.renameGroup()` — no rename UI |
| `GET /conversations/{id}/messages` | **Yes** | Thread history; `limit: 20`, `before` cursor when `hasMore` is true |
| `POST /messages` | **Yes** | Message composer; optimistic pending message, retry on failure |
| `GET /health` | **No** | Not used — chat app does not need a liveness probe |

### Socket.io

| Piece | Used | Notes |
| --- | --- | --- |
| Connect with `auth: { token }` | **Yes** | `use-chat-socket.ts` on chat page when logged in |
| `message:new` (server → client) | **Yes** | Incoming messages; `normalizeMessage()` then `applyIncomingMessage()` |
| `conversation:updated` (server → client) | **Yes** | Triggers inbox refresh after group create / member changes |
| `message:send` (client → server) | **No** | Outbound messages go through REST `POST /messages` only |

### Auth & headers

| Piece | Used | Notes |
| --- | --- | --- |
| `Authorization: Bearer <token>` on REST | **Yes** | Axios request interceptor in `api.ts` |
| JWT in socket handshake `auth` | **Yes** | Passed when connecting in `use-chat-socket.ts` |
| 401 → clear token + logout | **Yes** | Response interceptor dispatches `auth:unauthorized` |

### Documented quirks — handled in this app?

| Quirk | Handled | How |
| --- | --- | --- |
| Existing phone ignores new `name` on login | **Yes** | Auth store saves `user` from login/me response, not the form |
| `/api/health` 404 vs `/health` 200 | **N/A** | Health endpoint not called |
| Inconsistent envelopes (`data` vs array vs object) | **Yes** | Separate types per route in `types/api.ts`; no generic wrapper |
| Direct `participant` vs group `participants` | **Yes** | Discriminated on `conversation.type`; helpers in `lib/conversation.ts` |
| Empty `lastMessage: {}` | **Yes** | `isLastMessagePreview()` before preview / timestamp |
| Search returns current user | **Yes** | `excludeCurrentUser()` in search and members panel |
| No-`q` search returns ~50 users | **Yes** | Powers the globe “All members” view |
| Create direct returns id strings; list returns populated users | **Yes** | Reload conversations after create; title from list payload |
| Socket `id` + epoch ms vs REST `_id` + ISO | **Yes** | `normalizeMessage()` in `lib/message.ts` |
| REST send + socket both deliver same message | **Yes** | De-dupe by `_id` in `chat-store.sendMessage()` |
| Empty / whitespace messages | **Yes** | Blocked client-side via Zod `messageSchema` before API call |
| Group admin rules (add/remove/leave) | **Partial** | Add, remove, leave implemented; promote admin and rename **not** wired to UI |

### Assignment features → API mapping

| Feature | API used |
| --- | --- |
| Login (phone + name, auto-register) | `POST /auth/login`, `GET /auth/me` |
| Search & start conversation | `GET /users/search?q=`, `POST /conversations` |
| Group conversations | `POST /conversations/group`, participant add/remove/delete |
| Message list + timestamps | `GET /conversations/{id}/messages`, sender id vs `auth.user._id` |
| Send messages | `POST /messages` |
| Real-time updates | Socket `message:new`, `conversation:updated` |
| Load older messages | `GET .../messages?before=<id>` while `hasMore` |

---

## Base URLs

| Service | URL | Notes |
| --- | --- | --- |
| REST | `https://frontend-task-chatapp.onrender.com/api` | All auth, users, conversations, groups, messages |
| Socket.io | `https://frontend-task-chatapp.onrender.com` | Host **root**, not `/api`. Handshake path is `/socket.io/` |
| Health | `https://frontend-task-chatapp.onrender.com/health` | Host **root**. `GET /api/health` is **not** a valid route |

CORS on inspected responses: `Access-Control-Allow-Origin: *`.

---

## Authentication

There is no separate signup.

1. `POST /auth/login` with `phone` + `name`.
2. If the phone is new, an account is created. If it already exists, you are logged in.
3. The response includes a JWT.
4. Send it on every protected REST request:

```http
Authorization: Bearer <token>
```

5. For Socket.io, pass the same JWT in the handshake `auth` object.

`POST /auth/login` and `GET /health` are public. Everything else requires a bearer token.

---

## Shared shapes

### User (public)

```json
{
  "_id": "6a882468e5d6aac97521e25e",
  "name": "Ada Lovelace",
  "phone": "+15551234567"
}
```

`createdAt` is included on auth responses, not on search / participant objects.

### Message

```json
{
  "_id": "6a882fd7e5d6aac97521e9bb",
  "conversation": "6a88273de5d6aac97521e356",
  "sender": "6a882468e5d6aac97521e25e",
  "text": "Hello!",
  "createdAt": "2026-08-21T11:00:39.903Z"
}
```

`sender` is a **user id string**, not a populated user object.

### Last message (inbox preview)

Present on conversation list items. Either a preview object:

```json
{
  "text": "Hello from Test User!",
  "sender": "6a882468e5d6aac97521e25e",
  "createdAt": "2026-08-21T10:24:02.588Z"
}
```

or an **empty object** `{}` when the conversation has no messages yet. Do not treat `{}` as a real message.

### Error

```json
{
  "error": {
    "message": "Route not found",
    "code": "NOT_FOUND"
  }
}
```

Observed `code` values may vary by endpoint. Always read `error.message` / `error.code` rather than assuming HTTP text.

---

## Auth

### `POST /auth/login`

Log in or register in one step.

**Auth:** none

**Request**

```json
{
  "phone": "+15551234567",
  "name": "Ahasan"
}
```

| Field | Type | Required |
| --- | --- | --- |
| `phone` | string | yes |
| `name` | string | yes |

**Response `200`**

```json
{
  "token": "<jwt>",
  "user": {
    "_id": "6a882468e5d6aac97521e25e",
    "name": "Ada Lovelace",
    "phone": "+15551234567",
    "createdAt": "2026-08-21T10:11:52.529Z"
  }
}
```

**Quirk:** if the phone already exists, the original `name` is kept. Sending a different `name` on login does not rename the user. The login body above used `"Ahasan"`; `/auth/me` still returned `"Ada Lovelace"`.

---

### `GET /auth/me`

Restore the current session from a stored token.

**Auth:** bearer

**Response `200`**

```json
{
  "_id": "6a882468e5d6aac97521e25e",
  "name": "Ada Lovelace",
  "phone": "+15551234567",
  "createdAt": "2026-08-21T10:11:52.529Z"
}
```

---

## Users

### `GET /users/search`

Search other users (and yourself) by name or phone.

**Auth:** bearer

**Query**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `q` | string | documented as required | Name or phone fragment. **Live quirk:** omitting `q` (or sending empty) still returns `200` with a default list of about **50 users**. That is how the app’s “All members” view is loaded. |

**Response `200`** — a bare array, not wrapped in `{ data }`.

```json
[
  {
    "_id": "6a882468e5d6aac97521e25e",
    "name": "Ada Lovelace",
    "phone": "+15551234567"
  },
  {
    "_id": "6a8827c4e5d6aac97521e3ec",
    "name": "Ada Probe",
    "phone": "+15550001001"
  }
]
```

**Quirk:** results include the **current user**. Filter `user._id` out in the client before starting a chat.

---

## Conversations

A conversation is either `type: "direct"` (1-to-1) or `type: "group"` (three or more members, including the creator).

### `GET /conversations`

List conversations the current user belongs to.

**Auth:** bearer

**Response `200`** — wrapped in `{ data }`.

```json
{
  "data": [
    {
      "_id": "6a882755e5d6aac97521e376",
      "type": "group",
      "lastMessage": {},
      "updatedAt": "2026-08-21T10:24:21.213Z",
      "name": "Test Group",
      "createdBy": "6a882468e5d6aac97521e25e",
      "admins": ["6a882468e5d6aac97521e25e"],
      "participants": [
        {
          "_id": "6a882468e5d6aac97521e25e",
          "name": "Ada Lovelace",
          "phone": "+15551234567"
        }
      ]
    },
    {
      "_id": "6a88273de5d6aac97521e356",
      "type": "direct",
      "lastMessage": {
        "text": "Hello from Test User!",
        "sender": "6a882468e5d6aac97521e25e",
        "createdAt": "2026-08-21T10:24:02.588Z"
      },
      "updatedAt": "2026-08-21T10:24:02.823Z",
      "participant": {
        "_id": "6a88239de5d6aac97521e231",
        "name": "Test Candidate",
        "phone": "+8801700000001"
      }
    }
  ]
}
```

Direct vs group list items are **different shapes**:

| | Direct | Group |
| --- | --- | --- |
| Other people | `participant` (singular object) | `participants` (array of users) |
| Title | use `participant.name` | `name` |
| Admin fields | absent | `createdBy`, `admins` (id strings) |

---

### `POST /conversations`

Start or open a 1-to-1 conversation.

**Auth:** bearer

**Request**

```json
{
  "userId": "6a88239de5d6aac97521e231"
}
```

**Response `200`**

```json
{
  "_id": "6a88273de5d6aac97521e356",
  "participants": [
    "6a882468e5d6aac97521e25e",
    "6a88239de5d6aac97521e231"
  ],
  "createdAt": "2026-08-21T10:23:57.622Z"
}
```

**Quirk:** this create/open payload uses **id strings** in `participants`. The list endpoint returns populated user objects (and `participant` singular for directs). Calling this on an existing pair appears to return the existing conversation rather than duplicating it.

---

### `GET /conversations/{id}/messages`

Message history, newest page first, with cursor pagination for older messages.

**Auth:** bearer

**Path**

| Name | Description |
| --- | --- |
| `id` | Conversation id |

**Query**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `limit` | integer | no | Page size. Example: `20` |
| `before` | string | no | Cursor: fetch the page **before** a given message id |

**Response `200`**

```json
{
  "messages": [
    {
      "_id": "6a882742e5d6aac97521e366",
      "conversation": "6a88273de5d6aac97521e356",
      "sender": "6a882468e5d6aac97521e25e",
      "text": "Hello from Test User!",
      "createdAt": "2026-08-21T10:24:02.588Z"
    }
  ],
  "hasMore": false
}
```

After sending a second message, the same call returned both messages and `hasMore: false`.

To load older history: pass `before=<oldestVisibleMessageId>` while `hasMore` is `true`.

---

## Messages

### `POST /messages`

Send a message to a direct or group conversation. The same payload can also be sent over the socket (`message:send`). Recipients receive `message:new`.

**Auth:** bearer

**Request**

```json
{
  "conversationId": "6a88273de5d6aac97521e356",
  "text": "Hello!"
}
```

**Response `200`**

```json
{
  "_id": "6a882fd7e5d6aac97521e9bb",
  "conversation": "6a88273de5d6aac97521e356",
  "sender": "6a882468e5d6aac97521e25e",
  "text": "Hello!",
  "createdAt": "2026-08-21T11:00:39.903Z"
}
```

The client should still refuse empty / whitespace-only `text` before calling this.

---

## Groups

Groups need a name and **three or more members** (creator + at least two others). The creator starts as an admin. Only admins add/remove members, promote admins, and rename. Any member can leave by deleting themselves.

Request bodies below come from the official OpenAPI schemas. **Response bodies for these five endpoints were not live-captured**; expect a group conversation object similar to `GET /conversations`, and/or a `conversation:updated` socket event.

### `POST /conversations/group`

Create a group. Creator becomes an admin.

**Request**

```json
{
  "name": "Project Team",
  "participantIds": ["665f0c2a9b1e4a0012ab34cd", "665f0c2a9b1e4a0012ab34ce"]
}
```

`participantIds` are members **besides you**.

---

### `POST /conversations/{id}/participants`

Add members. Admins only.

**Request**

```json
{
  "userIds": ["665f0c2a9b1e4a0012ab34cf"]
}
```

---

### `DELETE /conversations/{id}/participants/{userId}`

Remove a member (admins only). Passing **your own** `userId` leaves the group.

---

### `POST /conversations/{id}/admins`

Promote an existing member to admin. Admins only.

**Request**

```json
{
  "userId": "665f0c2a9b1e4a0012ab34cd"
}
```

---

### `PATCH /conversations/{id}`

Rename a group. Admins only.

**Request**

```json
{
  "name": "Renamed Team"
}
```

---

## System

### `GET /health`

Liveness check. **No auth.**

Swagger’s server prefix makes “Try it out” hit `/api/health`, which is wrong.

| Request | Status | Body |
| --- | --- | --- |
| `GET https://frontend-task-chatapp.onrender.com/health` | `200` | `{ "status": "ok" }` |
| `GET https://frontend-task-chatapp.onrender.com/api/health` | `404` | `{ "error": { "message": "Route not found", "code": "NOT_FOUND" } }` |

---

## WebSocket (Socket.io)

Not in the OpenAPI paths. Connect to the **origin root**:

```js
import { io } from 'socket.io-client'

const socket = io('https://frontend-task-chatapp.onrender.com', {
  auth: { token },
})
```

An invalid or missing token is rejected.

### Events

| Direction | Event | Payload |
| --- | --- | --- |
| client → server | `message:send` | `{ conversationId, text }` — optional ack callback |
| server → client | `message:new` | Live payload uses `id` (not `_id`) and numeric `createdAt` (epoch ms). REST `POST /messages` still returns `_id` + ISO date. Normalize before storing. |
| server → client | `conversation:updated` | a group you are in changed — created, renamed, or members/admins changed |

Sending via REST still fans out `message:new`. The UI should append from the socket (and de-dupe by `_id` if it also used the REST response).

---

## Client mapping notes

These are the shapes the UI must not collapse into one type:

1. **Inbox list** is `{ data: Conversation[] }`. Search is a raw array. Message history is `{ messages, hasMore }`. Login is `{ token, user }`.
2. **Direct** inbox rows use `participant`. **Group** rows use `participants` + `name`.
3. **Create direct** returns `participants: string[]`. **List** returns populated users.
4. **`lastMessage` may be `{}`**. Guard with `lastMessage?.text`.
5. **Message `sender` is an id.** Compare to `auth.user._id` for sent vs received. Resolve names from the conversation’s participants.
6. **Search includes me.** Drop the current user before “start conversation” / “add to group”.

---

## Observed quirks (for the write-up)

| Observation | How to handle |
| --- | --- |
| Existing phone ignores a new `name` on login | Show the `user` object from the response, not the form value |
| `/api/health` 404 vs `/health` 200 | Health is not on the REST `/api` prefix |
| Inconsistent envelopes (`data` vs array vs object) | Per-endpoint types, not one generic `ApiResponse<T>` |
| Direct `participant` vs group `participants` | Discriminate on `type` |
| Empty `lastMessage: {}` | Treat as “no preview” |
| Search returns the current user | Client-side filter |
| `GET /users/search` with no `q` returns ~50 users | Used for the All members (globe) view |
| Create-conversation vs list-conversation participant shapes | Normalize in the API layer |
| Socket `message:new` uses `id` + epoch `createdAt`; REST uses `_id` + ISO | Normalize in one helper before the store |

---

## How this API would be named if we owned it

The live paths are used as-is. If this were a greenfield design:

| Live | Preferred |
| --- | --- |
| `POST /auth/login` (also registers) | keep — the one-step model is clear |
| `GET /users/search` | `GET /users?q=` |
| `POST /conversations` vs `POST /conversations/group` | `POST /conversations` with `{ type: "direct" \| "group", ... }` |
| `GET /conversations/{id}/messages` | keep |
| `POST /messages` | `POST /conversations/{id}/messages` so the resource is nested |
| Socket on origin, REST on `/api` | same origin + path, or document it more loudly in OpenAPI |

The client will call the **live** URLs above, not these preferred names.
