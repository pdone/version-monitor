import { db } from '../db';
import { repositories, Repository, NewRepository } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { getLatestRelease, getRepoInfo } from './github';
import { scheduleRepo, unscheduleRepo, checkRepo } from './scheduler';

export async function addRepo(owner: string, repo: string, cronExpression?: string): Promise<Repository> {
  const existing = db.select().from(repositories)
    .where(and(eq(repositories.owner, owner), eq(repositories.repo, repo)))
    .get();

  if (existing) {
    throw new Error('Repository already exists');
  }

  const repoInfo = await getRepoInfo(owner, repo);
  if (!repoInfo) {
    throw new Error('Repository not found on GitHub');
  }

  const release = await getLatestRelease(owner, repo);

  const newRepo: NewRepository = {
    owner,
    repo,
    description: repoInfo.description,
    htmlUrl: repoInfo.htmlUrl,
    cronExpression: cronExpression || '0 */6 * * *',
    localVersion: release?.tagName || null,
    latestVersion: release?.tagName || null,
    latestVersionUrl: release?.htmlUrl || null,
    hasUpdate: false,
    lastCheckedAt: new Date().toISOString(),
  };

  const created = db.insert(repositories).values(newRepo).returning().get();
  scheduleRepo(created);

  return created;
}

export async function updateRepo(id: number, data: Partial<Repository>): Promise<Repository> {
  const repo = db.select().from(repositories).where(eq(repositories.id, id)).get();
  if (!repo) {
    throw new Error('Repository not found');
  }

  const updateData: Record<string, any> = {
    ...data,
    updatedAt: new Date().toISOString(),
  };

  if (data.localVersion !== undefined) {
    updateData.hasUpdate = repo.latestVersion ? data.localVersion !== repo.latestVersion : false;
  }

  const updated = db.update(repositories)
    .set(updateData)
    .where(eq(repositories.id, id))
    .returning()
    .get();

  if (data.cronExpression !== undefined || data.isActive !== undefined) {
    scheduleRepo(updated);
  }

  return updated;
}

export async function deleteRepo(id: number): Promise<void> {
  const repo = db.select().from(repositories).where(eq(repositories.id, id)).get();
  if (!repo) {
    throw new Error('Repository not found');
  }

  unscheduleRepo(id);
  db.delete(repositories).where(eq(repositories.id, id)).run();
}

export async function getAllRepos(): Promise<Repository[]> {
  return db.select().from(repositories).all();
}

export async function getRepoById(id: number): Promise<Repository | null> {
  return db.select().from(repositories).where(eq(repositories.id, id)).get() || null;
}

export async function markRepoUpdated(id: number): Promise<Repository> {
  const repo = db.select().from(repositories).where(eq(repositories.id, id)).get();
  if (!repo) {
    throw new Error('Repository not found');
  }

  const updated = db.update(repositories)
    .set({
      localVersion: repo.latestVersion,
      hasUpdate: false,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(repositories.id, id))
    .returning()
    .get();

  return updated;
}

export async function triggerCheck(id: number): Promise<Repository> {
  const updated = await checkRepo(id);
  if (!updated) {
    throw new Error('Repository not found');
  }
  return updated;
}
