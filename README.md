# Version Monitor

A web application to monitor GitHub repository releases. Get notified when new versions are available.

> [中文文档](README.zh.md)

## Features

- Monitor GitHub repositories for new releases
- Global cron schedule & per-repo custom cron schedule
- Dark/Light/System theme support
- Multi-language support (English, 简体中文)
- Notifications via Webhook, ntfy, and VoceChat
- Custom HTTP method & headers for each notification channel
- Message template with variable substitution
- Test notification sending
- Batch notification for global cron repos
- SQLite database for local storage
- Modern UI with shadcn/ui components
- Optional password protection for web interface

## Screenshots

### Dashboard
![](https://cdn.awaw.cc/raw/pdone/static/master/img/project/version-monitor/1.png)

### Repositories
![](https://cdn.awaw.cc/raw/pdone/static/master/img/project/version-monitor/2.png)

### Settings
![](https://cdn.awaw.cc/raw/pdone/static/master/img/project/version-monitor/3.png)

## Tech Stack

### Backend
- Node.js + TypeScript
- Express.js
- Drizzle ORM + better-sqlite3
- node-cron
- @octokit/rest
- Zod

### Frontend
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
    image: ghcr.io/pdone/version-monitor:latest
    container_name: version-monitor
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
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
git clone https://github.com/pdone/version-monitor.git
cd version-monitor
docker compose up -d --build
```

### Manual Installation

#### Prerequisites

- Node.js 20+
- npm

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

Open http://localhost:3000 (Express serves both API and frontend static files)

## Usage

1. Open http://localhost:3000 (or http://localhost:5173 in dev mode)
2. Go to "Repositories" page and click "Add Repository"
3. Enter the GitHub owner and repository name
4. Configure the cron expression (default: use global schedule)
5. The app will automatically check for new releases

## Configuration

### GitHub Token (Optional)

To avoid rate limiting, you can add a GitHub Personal Access Token:

1. Go to Settings page
2. Enter your GitHub token
3. Click Save

### Authentication (Optional)

You can protect the web interface with a password:

1. Go to Settings page
2. Enter your access password
3. Click Save

When enabled, users must enter the password to access the interface. The authentication state is stored in a cookie for 30 days if "Remember me" is checked.

### Notifications

Configure one or more notification channels in Settings:

- **Webhook**: Send HTTP request to a URL when new release is detected
- **ntfy**: Push notifications via ntfy.sh
- **VoceChat**: Send notifications to a VoceChat channel or user

Each channel supports:
- Custom HTTP method (GET/POST)
- Custom request headers
- Custom message body template

#### Template Variables

| Variable | Description |
|----------|-------------|
| `{owner}` | Repository owner |
| `{repo}` | Repository name |
| `{repo_full}` | Full name (owner/repo) |
| `{latest_ver}` | Latest version |
| `{local_ver}` | Local (current) version |
| `{release_url}` | Release URL |
| `{timestamp}` | ISO timestamp |

### Cron Schedule

- **Global cron**: Applies to all repos that use the global schedule (default: `0 2 * * *`, daily at 2 AM)
- **Per-repo cron**: Override for individual repos (default: `0 */6 * * *`, every 6 hours)

## Cron Expression Examples

| Expression | Description |
|------------|-------------|
| `0 */6 * * *` | Every 6 hours |
| `0 */12 * * *` | Every 12 hours |
| `0 0 * * *` | Every day at midnight |
| `0 2 * * *` | Every day at 2 AM (global default) |
| `0 9 * * 1` | Every Monday at 9 AM |
| `*/30 * * * *` | Every 30 minutes |

Use [crontab.guru](https://crontab.guru) for help with cron expressions.

## API Endpoints

### Repositories

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/repos | List all repositories |
| GET | /api/repos/:id | Get a repository |
| POST | /api/repos | Add a repository |
| PUT | /api/repos/:id | Update repository settings |
| DELETE | /api/repos/:id | Remove a repository |
| POST | /api/repos/:id/mark-updated | Mark as updated |
| POST | /api/repos/:id/check | Trigger manual check |

### Settings

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/settings | Get all settings |
| GET | /api/settings/defaults | Get default notification templates |
| PUT | /api/settings | Update settings |
| POST | /api/settings/test-notification | Send test notification |

### Authentication

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/auth/check | Check if authentication is required |
| POST | /api/auth/verify | Verify password |

### Status

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/status | Server status |

## CI/CD

When a new tag is pushed (e.g., `v1.0.0`), GitHub Actions will automatically build and publish the Docker image to GitHub Container Registry (ghcr.io).

```bash
git tag v1.0.0
git push origin v1.0.0
```

## License

MIT
