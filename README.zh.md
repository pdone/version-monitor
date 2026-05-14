# Version Monitor

监控 GitHub 开源项目 Release 版本更新的 Web 应用。

## 功能特性

- 监控 GitHub 仓库的 Release 更新
- 每个仓库可自定义 cron 轮询周期
- 支持浅色/深色/跟随系统主题切换
- 支持多语言（English、简体中文）
- 支持 Webhook、ntfy、VoceChat 通知
- 消息模板
- SQLite 本地存储
- 现代化 UI（shadcn/ui）

## 技术栈

**后端：**
- Node.js + TypeScript
- Express.js
- Drizzle ORM + SQLite
- node-cron
- @octokit/rest

**前端：**
- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- Zustand
- React Router

## 快速开始

### Docker（推荐）

1. 创建 `docker-compose.yml`：

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
      - GITHUB_TOKEN=
    restart: unless-stopped
```

2. 启动服务：

```bash
docker compose up -d
```

3. 浏览器打开 http://localhost:3000

### Docker 本地构建

```bash
git clone https://github.com/your-username/version-monitor.git
cd version-monitor
docker compose up -d --build
```

### 手动安装

**前置要求：**
- Node.js 18+
- npm 或 yarn

**步骤：**

1. 安装依赖：
```bash
npm install
cd server && npm install
cd ../client && npm install
```

2. 启动开发服务器：
```bash
# 在根目录执行
npm run dev
```

- 后端运行在 http://localhost:3000
- 前端运行在 http://localhost:5173

**生产构建：**

```bash
npm run build
npm start
```

## 使用说明

1. 打开 http://localhost:3000（开发模式为 http://localhost:5173）
2. 进入「仓库」页面，点击「添加仓库」
3. 输入 GitHub 仓库的 owner 和 repo 名称
4. 配置 cron 表达式（默认每 6 小时检查一次）
5. 应用会自动检查新版本

## 配置说明

### GitHub Token（可选）

为避免 API 限流，可配置 GitHub Personal Access Token：

**方式一：环境变量（优先）**

在 `docker-compose.yml` 中设置：
```yaml
environment:
  - GITHUB_TOKEN=ghp_xxxxxxxxxxxx
```

**方式二：界面配置**

1. 进入设置页面
2. 输入 GitHub Token
3. 点击保存

### 通知渠道

在设置页面可配置以下通知：

- **Webhook**：检测到新版本时向指定 URL 发送 POST 请求
- **ntfy**：通过 ntfy.sh 发送推送通知
- **VoceChat**：向 VoceChat 频道发送通知

## Cron 表达式示例

| 表达式 | 说明 |
|--------|------|
| `0 */6 * * *` | 每 6 小时（默认） |
| `0 */12 * * *` | 每 12 小时 |
| `0 0 * * *` | 每天午夜 |
| `0 9 * * 1` | 每周一 9:00 |
| `*/30 * * * *` | 每 30 分钟 |

使用 [crontab.guru](https://crontab.guru) 生成自定义表达式。

## API 接口

### 仓库管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/repos | 获取所有仓库 |
| POST | /api/repos | 添加仓库 |
| PUT | /api/repos/:id | 更新仓库配置 |
| DELETE | /api/repos/:id | 删除仓库 |
| POST | /api/repos/:id/mark-updated | 标记已更新 |
| POST | /api/repos/:id/check | 手动触发检查 |

### 设置

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/settings | 获取设置 |
| PUT | /api/settings | 更新设置 |

## CI/CD

推送 tag 时（如 `v1.0.0`），GitHub Actions 会自动构建并发布到 `ghcr.io`。

```bash
git tag v1.0.0
git push origin v1.0.0
```

## 核心逻辑

```
添加仓库 → 获取 latest release → 存储为 local_version
    ↓
定时轮询（自定义 cron）→ 获取 latest release
    ↓
local_version != latest_version → has_update = true + 发送通知
    ↓
用户点击「已更新」→ local_version = latest_version → has_update = false
```

## 许可证

MIT
