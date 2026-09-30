# AI Assistant — Text-only Groq Chatbot

A production-quality, **frontend-only** text chatbot built with **React + TypeScript + Vite** and the **Groq API** (OpenAI-compatible Chat Completions). No backend, no accounts, no database. Chats persist in `localStorage` and auto-delete after **24 hours**.

## Features

- Text-only chat (no images, voice, files, or video)
- Groq responses via the OpenAI-compatible Chat Completions API (`https://api.groq.com/openai/v1/chat/completions`)
- Markdown responses: headings, lists, tables, bold/italic, links, inline code + code blocks with copy button + language label
- Animated AI skeleton while generating; duplicate submits blocked
- Stop-generation (request cancellation)
- Friendly error cards with Retry (invalid key, quota, rate limit, network, timeout, empty/blocked response)
- Empty state with clickable suggestion prompts
- Auto-growing composer: `Enter` sends, `Shift+Enter` newline, char limit (4000), touch-friendly
- Copy response button with "Copied ✓" feedback
- Smart auto-scroll (doesn't yank you if you scrolled up)
- Chat history sidebar → drawer on mobile; open / delete / new chat
- Local auto-titles from the first user message (no extra API call)
- Relative timestamps ("Just now", "5 min ago", "Today")
- Dark / light / system theme, persisted locally
- Responsive: phones, tablets, laptops, desktops, large screens
- Accessible: semantic HTML, ARIA labels, focus states, screen-reader loading states, keyboard navigation

## Tech stack

- React 19 + TypeScript (strict) + Vite
- `react-markdown` + `remark-gfm` for Markdown
- `lucide-react` for icons
- Browser `localStorage` only
- Plain modern CSS (CSS variables for theming, no framework)

## Project structure

```text
src/
├── components/
│   ├── chat/
│   │   ├── ChatContainer.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── MessageSkeleton.tsx
│   │   ├── ChatInput.tsx
│   │   └── EmptyState.tsx
│   ├── sidebar/
│   │   ├── ChatSidebar.tsx
│   │   └── ChatHistoryItem.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── MobileDrawer.tsx
│       └── SettingsModal.tsx
├── services/
│   └── groq.ts            # Groq API logic only (no UI)
├── hooks/
│   ├── useChat.ts
│   ├── useLocalStorage.ts
│   └── useTheme.ts
├── types/
│   └── chat.ts
├── utils/
│   ├── storage.ts         # localStorage + 24h expiry
│   ├── chatTitle.ts
│   └── date.ts
├── config.ts              # GROQ_MODEL lives here (single place)
├── App.tsx
├── main.tsx
└── index.css
```

The model name is defined once in `src/config.ts` as `GROQ_MODEL` (currently `openai/gpt-oss-20b`). To switch models, edit only that value. (Tip: `GET https://api.groq.com/openai/v1/models` returns the live list — Groq retires models regularly.)

## Installation

```bash
npm install
```

## Environment setup

Copy the example file and add your key:

```bash
# Windows (PowerShell)
copy .env.example .env
# macOS/Linux
cp .env.example .env
```

```env
VITE_GROQ_API_KEY=your_api_key_here
```

`.env` is git-ignored (never commit it). You can also set a per-browser override in the app under **Settings → Groq API** (stored only in that browser's `localStorage`); the override takes precedence over the env var.

## Run locally

```bash
npm run dev
```

## Build

```bash
npm run build
```

Type-check is part of the build (`tsc -b && vite build`).

## Groq API setup

1. Go to the [Groq console](https://console.groq.com/).
2. Sign in and open **API Keys** → **Create API Key**.
3. Copy the key (it starts with `gsk_`) into your `.env` as `VITE_GROQ_API_KEY`.
4. (Recommended) Set spend/rate limits on the key in the Groq console and monitor usage.
5. Restart `npm run dev` after changing `.env` (Vite embeds env vars at build/dev-start time).

## Important security warning

> `VITE_GROQ_API_KEY` is **bundled into the client JavaScript** and is visible to anyone who opens your site. A Vite `VITE_*` variable is configuration, **not a secret**. This is acceptable here only because the project is intentionally frontend-only with no backend.
>
> For anything beyond a demo / personal use:
> - Put Groq calls behind your own backend or proxy that holds the key.
> - Set tight spend/rate limits, monitor usage, and rotate the key if it leaks.

## Data storage (24-hour expiry)

- Chats are stored **only** in `localStorage` under `ai-chatbot.chats.v1`. No database, no backend, no cookies, no sync.
- Each chat stores `createdAt`, `updatedAt`, and `expiresAt = updatedAt + 24h`.
- On every app start **and** on every read/write, expired chats (`expiresAt <= now`) are purged.
- Sending/receiving a message refreshes `updatedAt`/`expiresAt` from that moment (a sliding 24h window from last activity) — expiry is never extended silently beyond 24h after the last update.
- Deleting a chat removes it from `localStorage` immediately. **Settings → Delete all chats** wipes everything.
- The UI shows: *"Chats are stored locally and automatically deleted after 24 hours."*

## Code quality

- `npm run build` passes (strict TS, no `any` in app code, no TODO placeholders in core flows).
- Responsibilities are separated: `services/groq.ts` never touches UI; components never call `fetch` directly.
