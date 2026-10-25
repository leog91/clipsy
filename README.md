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

### Optional Shelfy summary

Users connect from **Shelfy Account → Connect Clipsy**, sign in here if needed, review the account/app shown on the approval page, and allow read-only counts access. No per-user environment variables, account-ID copying or manual tokens. Each Shelfy account has its own connection. **Settings → Shelfy connections** lists grants and offers Disconnect; revocation never deletes videos. Shelfy also offers Disconnect. Access expires after 90 days and can be renewed by disconnecting/reconnecting.

The operator sets only `SHELFY_URL` to the trusted Shelfy origin in the root `.env` or hosting environment. It must match Shelfy's `BETTER_AUTH_URL`; Shelfy's `CLIPSY_URL` defaults to this hosted app. HTTPS is required in production; HTTP loopback is permitted only in development. Only the exact registered `/api/clipsy/callback` is accepted, never an arbitrary return URL. Remove the superseded `SHELFY_SUMMARY_USER_ID`/`SHELFY_SUMMARY_TOKEN_SHA256` settings; they no longer authorize access.

Review the new additive migrations in `packages/db/drizzle-integrations/` before intentionally running `bun run --cwd packages/db db:migrate:integrations` against an already-initialized Clipsy database. These migrations are tracked separately because the existing core migration directory is local/ignored; they create only integration tables and do not baseline/reset core data. Generate future integration changes with `bun run --cwd packages/db db:generate:integrations`. Shelfy's own connection migrations must also be applied intentionally. No remote migration/deployment is automatic.

`GET /api/integrations/summary` returns only active-account counts: `videos`, `toWatch`, `watching`, `collections` and `subscriptions`. Deleted records/accounts are excluded. A dedicated bearer token authorizes only summary reads and its own revocation, not item mutation or login. Authorization uses explicit consent, PKCE S256, exact redirect validation and hashed single-use codes with a five-minute expiry. Tokens are random, stored only as hashes here, scoped to the consenting account, and expire after 90 days. Shelfy encrypts credentials server-side; neither app shares auth secrets, databases or login cookies. Token/consent bodies are limited to 8 KiB; responses are private/no-store and redirects suppress referrers.

Isolated SQLite protocol/summary tests: `bun test packages/db/src/shelfy-grants.test.ts packages/db/src/summary.test.ts` (never uses the configured database).

### Existing endpoints

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
