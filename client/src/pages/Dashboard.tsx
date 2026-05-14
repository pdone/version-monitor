import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GitBranch, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRepoStore } from '@/stores';
import { useI18nStore } from '@/i18n';

export function Dashboard() {
  const { repos, fetchRepos, markUpdated } = useRepoStore();
  const { t } = useI18nStore();

  useEffect(() => {
    fetchRepos();
  }, [fetchRepos]);

  const totalRepos = repos.length;
  const reposWithUpdates = repos.filter((r) => r.hasUpdate).length;
  const activeRepos = repos.filter((r) => r.isActive).length;
  const reposNeedingUpdate = repos.filter((r) => r.hasUpdate);

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">{t('dashboard.title')}</h1>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalRepos')}</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRepos}</div>
            <p className="text-xs text-muted-foreground">
              {activeRepos} {t('dashboard.active')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.updatesAvailable')}</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reposWithUpdates}</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.reposHaveUpdates')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.status')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{t('dashboard.running')}</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.schedulerActive')}
            </p>
          </CardContent>
        </Card>
      </div>

      {reposNeedingUpdate.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.updatesTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reposNeedingUpdate.map((repo) => (
                <div
                  key={repo.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4"
                >
                  <div className="min-w-0">
                    <a
                      href={repo.htmlUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline break-all"
                    >
                      {repo.owner}/{repo.repo}
                    </a>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
                      <span>{t('repos.localVersion')}: {repo.localVersion || 'N/A'}</span>
                      <span className="hidden sm:inline">→</span>
                      <span>{t('repos.latestVersion')}: {repo.latestVersion || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {repo.latestVersionUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={repo.latestVersionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {t('dashboard.viewRelease')}
                        </a>
                      </Button>
                    )}
                    <Button size="sm" onClick={() => markUpdated(repo.id)}>
                      {t('dashboard.markUpdated')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('dashboard.recentRepos')}</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link to="/repos">{t('dashboard.viewAll')}</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {repos.length === 0 ? (
            <p className="text-muted-foreground">
              {t('dashboard.noRepos')}{' '}
              <Link to="/repos" className="text-primary hover:underline">
                {t('dashboard.addOneNow')}
              </Link>
            </p>
          ) : (
            <div className="space-y-2">
              {repos.slice(0, 5).map((repo) => (
                <div
                  key={repo.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <a
                      href={repo.htmlUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline break-all"
                    >
                      {repo.owner}/{repo.repo}
                    </a>
                    {repo.hasUpdate && (
                      <Badge variant="success" className="shrink-0">{t('dashboard.updateAvailable')}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
                    <Clock className="h-3 w-3" />
                    {repo.lastCheckedAt
                      ? new Date(repo.lastCheckedAt).toLocaleString()
                      : t('repos.never')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
