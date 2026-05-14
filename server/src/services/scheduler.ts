import cron from 'node-cron';
import { db } from '../db';
import { repositories, Repository } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getLatestRelease } from './github';
import { sendNotification } from './notification';

const scheduledTasks = new Map<number, cron.ScheduledTask>();

export function startScheduler() {
  const repos = db.select().from(repositories).where(eq(repositories.isActive, true)).all();
  for (const repo of repos) {
    scheduleRepo(repo);
  }
  console.log(`Scheduler started with ${repos.length} repositories`);
}

export function stopScheduler() {
  for (const [id, task] of scheduledTasks) {
    task.stop();
  }
  scheduledTasks.clear();
  console.log('Scheduler stopped');
}

export function scheduleRepo(repo: Repository) {
  if (scheduledTasks.has(repo.id)) {
    scheduledTasks.get(repo.id)?.stop();
    scheduledTasks.delete(repo.id);
  }

  if (!repo.isActive) {
    return;
  }

  const cronExpr = repo.cronExpression || '0 */6 * * *';

  if (!cron.validate(cronExpr)) {
    console.error(`Invalid cron expression for repo ${repo.owner}/${repo.repo}: ${cronExpr}`);
    return;
  }

  const task = cron.schedule(cronExpr, async () => {
    await checkRepo(repo.id);
  });

  scheduledTasks.set(repo.id, task);
  console.log(`Scheduled repo ${repo.owner}/${repo.repo} with cron: ${cronExpr}`);
}

export function unscheduleRepo(repoId: number) {
  const task = scheduledTasks.get(repoId);
  if (task) {
    task.stop();
    scheduledTasks.delete(repoId);
  }
}

export async function checkRepo(repoId: number): Promise<Repository | null> {
  const repo = db.select().from(repositories).where(eq(repositories.id, repoId)).get();
  if (!repo) {
    return null;
  }

  try {
    const release = await getLatestRelease(repo.owner, repo.repo);

    if (!release) {
      db.update(repositories)
        .set({ lastCheckedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
        .where(eq(repositories.id, repoId))
        .run();
      return repo;
    }

    const previousVersion = repo.latestVersion;
    const hasUpdate = repo.localVersion !== null && repo.localVersion !== release.tagName;

    const updatedRepo = db.update(repositories)
      .set({
        latestVersion: release.tagName,
        latestVersionUrl: release.htmlUrl,
        hasUpdate,
        lastCheckedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(repositories.id, repoId))
      .returning()
      .get();

    if (previousVersion && previousVersion !== release.tagName && repo.localVersion !== release.tagName) {
      await sendNotification({
        repo: updatedRepo,
        newVersion: release.tagName,
        previousVersion: previousVersion,
      });
    } else if (repo.localVersion && repo.localVersion !== release.tagName) {
      await sendNotification({
        repo: updatedRepo,
        newVersion: release.tagName,
        previousVersion: repo.localVersion,
      });
    }

    return updatedRepo;
  } catch (error) {
    console.error(`Error checking repo ${repo.owner}/${repo.repo}:`, error);
    db.update(repositories)
      .set({ lastCheckedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      .where(eq(repositories.id, repoId))
      .run();
    return repo;
  }
}
