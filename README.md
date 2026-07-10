# Clipsy

A search-first YouTube bookmarking app. Save videos via URL or Chrome extension, keep useful timestamps, subscribe to channels, and organize everything for fast retrieval using search, tags, and collections.

## Features

- Save YouTube videos via URL
- Auto-fetch metadata (title, thumbnail, channel, duration)
- Save and edit video start timestamps
- Watch saved clips in an embedded player or open them on YouTube
- Organize with tags and collections
- Share collections publicly with a toggle
- Fast search over saved content
- Status tracking (to_watch, watching)
- Subscribe to YouTube channels and check for new videos via RSS
- Group subscriptions with categories
- Chrome extension for quick video and channel saving
- Account settings with password changes and linked social providers
- Admin panel for user management, moderation, audit logs, and trash/restore flows

## Tech Stack

- **Runtime**: Bun
- **Monorepo**: Bun workspaces + Turborepo
- **Web**: Next.js (App Router, TypeScript, Tailwind)
- **Extension**: Plasmo (Chrome extension)
- **Database**: Drizzle ORM + Turso (SQLite edge DB)
- **Auth**: Better Auth
- **Validation**: Zod

## Setup

### Prerequisites

- Bun installed
- Turso account and database created

### 1. Install dependencies

```bash
bun install
```

### 2. Set up environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `TURSO_DATABASE_URL` - Your Turso database URL
- `TURSO_AUTH_TOKEN` - Your Turso auth token
- `BETTER_AUTH_SECRET` - Random secret for Better Auth (generate with `openssl rand -base64 32`)
- `BETTER_AUTH_URL` - Your deployed app URL in production. Use `http://localhost:3000` only for local development.
- `ADMIN_EMAILS` - Optional comma-separated list of emails that should always have admin access.

- `NEXT_PUBLIC_APP_URL` - Optional public app URL. If unset, auth requests use the current site origin. Do not set this to localhost in Vercel.

Optional (for social auth):
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

Extension configuration lives in `apps/extension/.env.example`:

```bash
cp apps/extension/.env.example apps/extension/.env
```

- `PLASMO_PUBLIC_WEB_APP_URL` - Intended web app URL for extension builds.

Note: the extension currently chooses between hardcoded production and local app URLs in `apps/extension/utils.ts`. The popup's dev mode toggle switches between those two values.

### 3. Set up the database

Generate and push the schema:

```bash
bun run db:generate
bun run db:push
```

### 4. Run the development server

```bash
bun run dev
```

This starts both the web app and extension in development mode.

### 5. Build the extension

```bash
bun run --cwd apps/extension build
```

Load the extension in Chrome:
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `apps/extension/build/chrome-mv3-prod`

## Project Structure

```
clipsy/
├─ apps/
│  ├─ web/            # Next.js App Router
│  └─ extension/      # Plasmo Chrome extension
├─ packages/
│  ├─ db/             # Drizzle ORM schema + client
│  └─ shared/         # Zod schemas + shared types
├─ turbo.json
├─ package.json
└─ tsconfig.base.json
```

## Usage

### Web App

1. Sign in with email/password or social auth
2. Paste a YouTube URL to save a video
3. Save timestamped URLs or edit a clip's start time from its detail page
4. Organize with tags and collections
5. Filter by status, tag, or collection
6. Toggle a collection to public and share it via `/share/<collection-id>`
7. Search by title, channel, or tags
8. Watch clips in the embedded player or open them on YouTube

### Subscriptions

1. Open `/subscriptions`
2. Add a YouTube channel URL
3. Optionally assign the channel to a category
4. Refresh subscriptions to check YouTube RSS for new videos
5. Mark subscriptions as seen when you have reviewed the latest video

### Chrome Extension

1. Navigate to any YouTube video
2. Click the floating "Save to Clipsy" button
3. Clipsy opens with a save confirmation for the current URL
4. If the current playback time is at least 10 seconds, the extension includes a timestamp
5. Navigate to a YouTube channel page and click "Save channel" to open Clipsy with a subscription confirmation

The extension popup includes toggles for hiding the floating button in fullscreen and switching the target app URL to localhost for development.

### Admin

Admins are users with `role = admin` or emails listed in `ADMIN_EMAILS`. Admins can access `/admin` to:

- View dashboard metrics
- Search, edit, soft-delete, restore, and hard-delete users
- Moderate public collections
- Review audit logs

## API Endpoints

- `POST /api/items` - Create item from URL
- `GET /api/items` - List all items
- `GET /api/items/[id]` - Get item by ID
- `PUT /api/items/[id]` - Update item
- `GET /api/search?q=query` - Search items
- `GET /api/tags` - List tags
- `POST /api/tags` - Create tag
- `GET /api/collections` - List collections
- `POST /api/collections` - Create collection
- `PATCH /api/collections/[id]` - Update collection visibility
- `GET /api/auth/providers` - List configured social auth providers
- `/api/auth/[...all]` - Better Auth route handler
- `GET /share/[collectionId]` - Public shared collection page

## Development Commands

```bash
bun run dev          # Start all apps in dev mode
bun run build        # Build all apps
bun run lint         # Lint all apps
bun run typecheck    # Type check all apps
bun run db:generate  # Generate Drizzle migrations
bun run db:push      # Push schema to database
bun run db:migrate   # Run migrations
bun run --cwd apps/extension dev    # Start extension development mode
bun run --cwd apps/extension build  # Build the extension
```

## License

MIT
