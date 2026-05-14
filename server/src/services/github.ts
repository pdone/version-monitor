import { Octokit } from '@octokit/rest';
import { db } from '../db';
import { settings } from '../db/schema';
import { eq } from 'drizzle-orm';

function getOctokit(): Octokit {
  const dbToken = db.select().from(settings).where(eq(settings.key, 'github_token')).get()?.value || '';

  if (dbToken) {
    return new Octokit({ auth: dbToken });
  }
  return new Octokit();
}

export interface LatestRelease {
  tagName: string;
  name: string | null;
  body: string | null;
  htmlUrl: string;
  publishedAt: string | null;
  isPrerelease: boolean;
}

export async function getLatestRelease(owner: string, repo: string): Promise<LatestRelease | null> {
  try {
    const octokit = getOctokit();
    const { data } = await octokit.repos.getLatestRelease({ owner, repo });

    return {
      tagName: data.tag_name,
      name: data.name,
      body: data.body || null,
      htmlUrl: data.html_url,
      publishedAt: data.published_at,
      isPrerelease: data.prerelease,
    };
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}

export interface RepoInfo {
  description: string | null;
  htmlUrl: string;
}

export async function getRepoInfo(owner: string, repo: string): Promise<RepoInfo | null> {
  try {
    const octokit = getOctokit();
    const { data } = await octokit.repos.get({ owner, repo });

    return {
      description: data.description,
      htmlUrl: data.html_url,
    };
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}
