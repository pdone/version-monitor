import cron from 'node-cron';
import { db } from '../db';
import { repositories, Repository, settings } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getLatestRelease } from './github';
import { sendNotification, sendBatchNotification } from './notification';

const scheduledTasks = new Map<number, cron.ScheduledTask>();
const globalCronTaskKey = '__global_cron__';

function getGlobalCron(): string {
  const setting = db.select().from(settings).where(eq(settings.key, 'global_cron')).get();
  return setting?.value || '0 2 * * *';
}

export function startScheduler() {
  const repos = db.select().from(repositories).where(eq(repositories.isActive, true)).all();
  for (const repo of repos) {
    scheduleRepo(repo);
  }
  
  // Schedule global cron task for repos using global schedule
  scheduleGlobalCronTask();
  
  console.log(`Scheduler started with ${repos.length} repositories`);
}

function scheduleGlobalCronTask() {
  if (scheduledTasks.has(globalCronTaskKey as any)) {
    scheduledTasks.get(globalCronTaskKey as any)?.stop();
    scheduledTasks.delete(globalCronTaskKey as any);
  }

  const cronExpr = getGlobalCron();

  if (!cron.validate(cronExpr)) {
    console.error(`Invalid global cron expression: ${cronExpr}`);
    return;
  }

  const task = cron.schedule(cronExpr, async () => {
    await checkGlobalCronRepos();
  });

  scheduledTasks.set(globalCronTaskKey as any, task);
  console.log(`Global cron scheduled with: ${cronExpr}`);
}

export function refreshGlobalCronSchedule() {
  scheduleGlobalCronTask();
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

  // Skip scheduling individual task if using global cron
  if (repo.useGlobalCron) {
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

    db.update(repositories)
      .set({
        latestVersion: release.tagName,
        latestVersionUrl: release.htmlUrl,
        latestReleasePublishedAt: release.publishedAt,
        hasUpdate,
        lastCheckedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(repositories.id, repoId))
      .run();

    const updatedRepo = db.select().from(repositories).where(eq(repositories.id, repoId)).get()!;

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
    } else if (!previousVersion && !repo.localVersion) {
      await sendNotification({
        repo: updatedRepo,
        newVersion: release.tagName,
        previousVersion: null,
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

export async function checkGlobalCronRepos(): Promise<void> {
  const repos = db.select().from(repositories)
    .where(eq(repositories.isActive, true))
    .all()
    .filter(repo => repo.useGlobalCron);

  if (repos.length === 0) {
    return;
  }

  const notificationsToSend: Array<{
    repo: Repository;
    newVersion: string;
    previousVersion: string | null;
  }> = [];

  for (const repo of repos) {
    try {
      const release = await getLatestRelease(repo.owner, repo.repo);

      if (!release) {
        db.update(repositories)
          .set({ lastCheckedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
          .where(eq(repositories.id, repo.id))
          .run();
        continue;
      }

      const previousVersion = repo.latestVersion;
      const hasUpdate = repo.localVersion !== null && repo.localVersion !== release.tagName;

      db.update(repositories)
        .set({
          latestVersion: release.tagName,
          latestVersionUrl: release.htmlUrl,
          latestReleasePublishedAt: release.publishedAt,
          hasUpdate,
          lastCheckedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(repositories.id, repo.id))
        .run();

      const updatedRepo = db.select().from(repositories).where(eq(repositories.id, repo.id)).get()!;

      if (previousVersion && previousVersion !== release.tagName && repo.localVersion !== release.tagName) {
        notificationsToSend.push({
          repo: updatedRepo,
          newVersion: release.tagName,
          previousVersion: previousVersion,
        });
      } else if (repo.localVersion && repo.localVersion !== release.tagName) {
        notificationsToSend.push({
          repo: updatedRepo,
          newVersion: release.tagName,
          previousVersion: repo.localVersion,
        });
      } else if (!previousVersion && !repo.localVersion) {
        notificationsToSend.push({
          repo: updatedRepo,
          newVersion: release.tagName,
          previousVersion: null,
        });
      }
    } catch (error) {
      console.error(`Error checking repo ${repo.owner}/${repo.repo}:`, error);
      db.update(repositories)
        .set({ lastCheckedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
        .where(eq(repositories.id, repo.id))
        .run();
    }
  }

  if (notificationsToSend.length > 0) {
    await sendBatchNotification(notificationsToSend);
  }
}
