# Clipsy

A search-first YouTube bookmarking app. Save videos via URL or chrome extension and organize them for fast retrieval using search, tags, and collections.

## Features

- Save YouTube videos via URL
- Auto-fetch metadata (title, thumbnail, channel, duration)
- Organize with tags and collections
- Fast search over saved content
- Status tracking (to_watch, watching)
- Chrome extension for quick saving
- Open videos directly on YouTube

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

- `NEXT_PUBLIC_APP_URL` - Optional public app URL. If unset, auth requests use the current site origin. Do not set this to localhost in Vercel.

Optional (for social auth):
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

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
cd apps/extension
bun run build
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
3. Organize with tags and collections
4. Search by title, channel, or tags
5. Click to open videos on YouTube

### Chrome Extension

1. Navigate to any YouTube video
2. Click "Save to Clipsy" button
3. Video is automatically saved to your account

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

## Development Commands

```bash
bun run dev          # Start all apps in dev mode
bun run build        # Build all apps
bun run lint         # Lint all apps
bun run typecheck    # Type check all apps
bun run db:generate  # Generate Drizzle migrations
bun run db:push      # Push schema to database
bun run db:migrate   # Run migrations
```

## License

MIT
