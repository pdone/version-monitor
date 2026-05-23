import express from 'express';
import cors from 'cors';
import path from 'path';
import { initializeDatabase } from './db';
import { startScheduler, stopScheduler } from './services/scheduler';
import reposRouter from './routes/repos';
import settingsRouter from './routes/settings';
import aboutRouter from './routes/about';
import authRouter from './routes/auth';

const app = express();
const PORT = process.env.PORT || 3000;

const packageJson = require('../package.json');

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/repos', reposRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/about', aboutRouter);

app.get('/api/status', (_req, res) => {
  res.json({
    status: 'running',
    version: packageJson.version,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/latest-version', async (_req, res) => {
  try {
    const response = await fetch('https://api.github.com/repos/pdone/version-monitor/releases/latest');
    if (!response.ok) {
      throw new Error('Failed to fetch');
    }
    const data = await response.json() as { tag_name?: string };
    res.json({ version: data.tag_name?.replace(/^v/, '') || '' });
  } catch {
    res.json({ version: '' });
  }
});

const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

initializeDatabase();
startScheduler();

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  stopScheduler();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 5000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
