# AGENTS.md

## Project Structure

Two-package monorepo (not a workspace). Root `package.json` orchestrates `server/` and `client/`.

- `server/` — Express + TypeScript backend. Entry: `server/src/index.ts` → `server/dist/index.js`
- `client/` — React 18 + Vite + Tailwind frontend. Entry: `client/src/main.tsx`
- `data/` — SQLite database file (`version-monitor.db`), gitignored

## Commands

```bash
# Install (3 separate installs, no workspaces)
npm install && cd server && npm install && cd ../client && npm install

# Development (from root)
npm run dev        # concurrently starts server (:3000) and client (:5173)

# Build (from root)
npm run build      # builds server first (tsc), then client (tsc -b && vite build)

# Production (from root)
npm run start      # runs node server/dist/index.js

# Server only
cd server && npm run dev          # tsx watch src/index.ts
cd server && npm run db:generate  # drizzle-kit generate
cd server && npm run db:migrate   # drizzle-kit migrate

# Client only
cd client && npm run dev          # vite
cd client && npm run lint         # eslint
```

No root-level lint, typecheck, or test commands exist. Only `client/` has a `lint` script.

## Architecture

- API routes: `server/src/routes/repos.ts`, `server/src/routes/settings.ts`
- Background scheduler: `server/src/services/scheduler.ts` (node-cron)
- GitHub API: `server/src/services/github.ts` (@octokit/rest)
- Notifications: `server/src/services/notification.ts` (webhook, ntfy, VoceChat)
- Client state: Zustand stores in `client/src/stores/`
- UI: shadcn/ui components in `client/src/components/ui/`
- i18n: `client/src/i18n/`

## Gotchas

- **DB schema is defined in two places**: Drizzle schema (`server/src/db/schema.ts`) AND raw SQL in `initializeDatabase()` (`server/src/db/index.ts`). Both must be kept in sync when changing tables.
- **Dependencies are not hoisted**: install in root, `server/`, and `client/` separately. The Dockerfile copies each `node_modules/` independently.
- **Server tsconfig**: `module: "commonjs"`, output to `server/dist/`
- **Client tsconfig**: `noUnusedLocals` and `noUnusedParameters` are strict. Unused imports will fail the build.
- **Client path alias**: `@/` maps to `client/src/` (configured in both `vite.config.ts` and `tsconfig.json`).
- **Vite proxy**: client dev server proxies `/api` to `http://localhost:3000`.
- **Database path**: resolved relative to compiled output (`../../data/` from `server/dist/`), so the DB ends up at `data/version-monitor.db` from the project root.

## CI/CD

GitHub Actions workflow (`.github/workflows/docker-publish.yml`) builds and pushes a Docker image to `ghcr.io` on tag push (`v*`). Tag format: `v1.0.0`.

## Git Commit Template

```txt
feat xxx
- feature A
- B

fix xxx

...
```

Do not add semicolons after `feat`,`fix` 