# Version Monitor

A web application to monitor GitHub repository releases. Get notified when new versions are available.

## Features

- Monitor GitHub repositories for new releases
- Customizable cron schedule for each repository
- Dark/Light/System theme support
- Multi-language support (English, 简体中文)
- Notifications via Webhook, ntfy, and VoceChat
- Message template
- SQLite database for local storage
- Modern UI with shadcn/ui components

## Tech Stack

**Backend:**
- Node.js + TypeScript
- Express.js
- Drizzle ORM + SQLite
- node-cron
- @octokit/rest

**Frontend:**
- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- Zustand
- React Router

## Getting Started

### Docker (Recommended)

1. Create a `docker-compose.yml` file:

```yaml
services:
  version-monitor:
    image: ghcr.io/your-username/version-monitor:latest
    container_name: version-monitor
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
```

2. Start the service:

```bash
docker compose up -d
```

3. Open http://localhost:3000 in your browser

### Docker Build from Source

```bash
git clone https://github.com/your-username/version-monitor.git
cd version-monitor
docker compose up -d --build
```

### Manual Installation

#### Prerequisites

- Node.js 18+
- npm or yarn

#### Steps

1. Install dependencies:
```bash
npm install
cd server && npm install
cd ../client && npm install
```

2. Start the development server:
```bash
# From root directory
npm run dev
```

This will start:
- Backend server on http://localhost:3000
- Frontend dev server on http://localhost:5173

#### Production Build

```bash
npm run build
npm start
```

## Usage

1. Open http://localhost:3000 (or http://localhost:5173 in dev mode)
2. Go to "Repositories" page and click "Add Repository"
3. Enter the GitHub owner and repository name
4. Configure the cron expression (default: every 6 hours)
5. The app will automatically check for new releases

## Configuration

### GitHub Token (Optional)

To avoid rate limiting, you can add a GitHub Personal Access Token:

**Option 1: Environment Variable (Recommended)**

Set in `docker-compose.yml`:
```yaml
environment:
  - GITHUB_TOKEN=ghp_xxxxxxxxxxxx
```

**Option 2: Web UI**

1. Go to Settings page
2. Enter your GitHub token
3. Click Save

Note: Environment variable takes priority over the web UI setting.

### Notifications

Configure one or more notification channels in Settings:

- **Webhook**: POST request to a URL when new release is detected
- **ntfy**: Push notifications via ntfy.sh
- **VoceChat**: Send notifications to a VoceChat channel

## Cron Expression Examples

- `0 */6 * * *` - Every 6 hours (default)
- `0 */12 * * *` - Every 12 hours
- `0 0 * * *` - Every day at midnight
- `0 9 * * 1` - Every Monday at 9 AM
- `*/30 * * * *` - Every 30 minutes

Use [crontab.guru](https://crontab.guru) for help with cron expressions.

## API Endpoints

### Repositories

- `GET /api/repos` - List all repositories
- `POST /api/repos` - Add a repository
- `PUT /api/repos/:id` - Update repository settings
- `DELETE /api/repos/:id` - Remove a repository
- `POST /api/repos/:id/mark-updated` - Mark as updated
- `POST /api/repos/:id/check` - Trigger manual check

### Settings

- `GET /api/settings` - Get all settings
- `PUT /api/settings` - Update settings

## CI/CD

When a new tag is pushed (e.g., `v1.0.0`), GitHub Actions will automatically build and publish the Docker image to GitHub Container Registry (ghcr.io).

```bash
git tag v1.0.0
git push origin v1.0.0
```

## License

MIT
