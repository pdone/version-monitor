import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Trash2, ExternalLink, Check, Pencil, Clock, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useRepoStore, useSettingsStore } from '@/stores';
import { AddRepoDialog } from '@/components/AddRepoDialog';
import { EditRepoDialog } from '@/components/EditRepoDialog';
import { toast } from '@/components/ui/toast';
import { useI18nStore } from '@/i18n';
import type { Repository } from '@/lib/api';

type SortField = 'name' | 'updatedAt';
type SortOrder = 'asc' | 'desc';

export function Repos() {
  const { repos, fetchRepos, addRepo, updateRepo, deleteRepo, markUpdated, triggerCheck } = useRepoStore();
  const { settings, fetchSettings } = useSettingsStore();
  const { t } = useI18nStore();
  const [editRepo, setEditRepo] = useState<{ id: number; owner: string; repo: string; useGlobalCron: boolean; cronExpression: string; localVersion?: string } | null>(null);
  const [sortField, setSortField] = useState<SortField>(() => {
    return (localStorage.getItem('repos-sort-field') as SortField) || 'updatedAt';
  });
  const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
    return (localStorage.getItem('repos-sort-order') as SortOrder) || 'desc';
  });

  const globalCron = settings.global_cron || '0 2 * * *';

  useEffect(() => {
    fetchRepos();
    fetchSettings();
  }, [fetchRepos, fetchSettings]);

  const handleAdd = async (owner: string, repo: string, useGlobalCron: boolean, cronExpression: string) => {
    try {
      await addRepo(owner, repo, useGlobalCron, cronExpression);
      toast({ title: t('repos.addSuccess') });
    } catch (err: any) {
      toast({ title: t('repos.addFailed'), description: err.message, variant: 'destructive' });
      throw err;
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(t('repos.confirmDelete', { name }))) {
      try {
        await deleteRepo(id);
        toast({ title: t('repos.deleteSuccess') });
      } catch (err: any) {
        toast({ title: t('repos.deleteFailed'), description: err.message, variant: 'destructive' });
      }
    }
  };

  const handleMarkUpdated = async (id: number) => {
    try {
      await markUpdated(id);
      toast({ title: t('repos.markSuccess') });
    } catch (err: any) {
      toast({ title: t('repos.markFailed'), description: err.message, variant: 'destructive' });
    }
  };

  const handleCheck = async (id: number) => {
    try {
      await triggerCheck(id);
      toast({ title: t('repos.checkSuccess') });
    } catch (err: any) {
      toast({ title: t('repos.checkFailed'), description: err.message, variant: 'destructive' });
    }
  };

  const handleEdit = async (id: number, useGlobalCron: boolean, cronExpression: string, localVersion?: string) => {
    try {
      await updateRepo(id, { useGlobalCron, cronExpression, localVersion });
      toast({ title: t('repos.editSuccess') });
    } catch (err: any) {
      toast({ title: t('repos.editFailed'), description: err.message, variant: 'destructive' });
      throw err;
    }
  };

  const sortRepos = (reposToSort: Repository[]) => {
    return [...reposToSort].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        const nameA = `${a.owner}/${a.repo}`.toLowerCase();
        const nameB = `${b.owner}/${b.repo}`.toLowerCase();
        comparison = nameA.localeCompare(nameB);
      } else {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        comparison = dateA - dateB;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      const next = sortOrder === 'asc' ? 'desc' : 'asc';
      setSortOrder(next);
      localStorage.setItem('repos-sort-order', next);
    } else {
      setSortField(field);
      const order = field === 'name' ? 'asc' : 'desc';
      setSortOrder(order);
      localStorage.setItem('repos-sort-field', field);
      localStorage.setItem('repos-sort-order', order);
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3" />;
    return sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  const globalCronRepos = sortRepos(repos.filter(repo => repo.useGlobalCron));
  const customCronRepos = sortRepos(repos.filter(repo => !repo.useGlobalCron));

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">{t('repos.title')}</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              variant={sortField === 'name' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => toggleSort('name')}
              className="h-8 px-2 text-xs"
            >
              {t('repos.sortByName')}
              {getSortIcon('name')}
            </Button>
            <Button
              variant={sortField === 'updatedAt' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => toggleSort('updatedAt')}
              className="h-8 px-2 text-xs"
            >
              {t('repos.sortByUpdate')}
              {getSortIcon('updatedAt')}
            </Button>
          </div>
          <AddRepoDialog onSubmit={handleAdd} globalCron={globalCron} />
        </div>
      </div>

      {/* Global Cron Repos */}
      <Card>
        <CardHeader>
          <CardTitle>{t('repos.globalCronRepos')} ({globalCronRepos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {globalCronRepos.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t('repos.noGlobalCronRepos')}
            </p>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('repos.repository')}</TableHead>
                      <TableHead>{t('repos.localVersion')}</TableHead>
                      <TableHead>{t('repos.latestVersion')}</TableHead>
                      <TableHead>{t('repos.status')}</TableHead>
                      <TableHead>{t('repos.lastChecked')}</TableHead>
                      <TableHead className="text-right">{t('repos.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {globalCronRepos.map((repo) => (
                      <TableRow key={repo.id}>
                        <TableCell>
                          <div>
                            <a
                              href={repo.htmlUrl || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium hover:underline flex items-center gap-1"
                            >
                              {repo.owner}/{repo.repo}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            {repo.description && (
                              <p className="text-sm text-muted-foreground mt-1">{repo.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {repo.localVersion || 'N/A'}
                          </code>
                        </TableCell>
                        <TableCell>
                          {repo.latestVersionUrl ? (
                            <a
                              href={repo.latestVersionUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm hover:underline"
                            >
                              <code className="bg-muted px-2 py-1 rounded">{repo.latestVersion || 'N/A'}</code>
                            </a>
                          ) : (
                            <code className="text-sm bg-muted px-2 py-1 rounded">{repo.latestVersion || 'N/A'}</code>
                          )}
                        </TableCell>
                        <TableCell>
                          {repo.hasUpdate ? (
                            <Badge variant="success" className="whitespace-nowrap">{t('dashboard.updateAvailable')}</Badge>
                          ) : (
                            <Badge variant="secondary" className="whitespace-nowrap">{t('repos.upToDate')}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {repo.lastCheckedAt ? new Date(repo.lastCheckedAt).toLocaleString() : t('repos.never')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {repo.hasUpdate && (
                              <Button variant="default" size="sm" onClick={() => handleMarkUpdated(repo.id)}>
                                <Check className="mr-1 h-3 w-3" />
                                {t('repos.markUpdated')}
                              </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={() => setEditRepo({ id: repo.id, owner: repo.owner, repo: repo.repo, useGlobalCron: repo.useGlobalCron, cronExpression: repo.cronExpression || '0 */6 * * *', localVersion: repo.localVersion || '' })}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleCheck(repo.id)}>
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(repo.id, `${repo.owner}/${repo.repo}`)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden space-y-3">
                {globalCronRepos.map((repo) => (
                  <div key={repo.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <a
                          href={repo.htmlUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:underline flex items-center gap-1 break-all"
                        >
                          {repo.owner}/{repo.repo}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                        {repo.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{repo.description}</p>
                        )}
                      </div>
                      {repo.hasUpdate ? (
                        <Badge variant="success" className="shrink-0 whitespace-nowrap">{t('dashboard.updateAvailable')}</Badge>
                      ) : (
                        <Badge variant="secondary" className="shrink-0 whitespace-nowrap">{t('repos.upToDate')}</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">{t('repos.localVersion')}</span>
                        <code className="block text-sm bg-muted px-2 py-1 rounded mt-1 truncate">
                          {repo.localVersion || 'N/A'}
                        </code>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('repos.latestVersion')}</span>
                        {repo.latestVersionUrl ? (
                          <a href={repo.latestVersionUrl} target="_blank" rel="noopener noreferrer">
                            <code className="block text-sm bg-muted px-2 py-1 rounded mt-1 hover:underline truncate">
                              {repo.latestVersion || 'N/A'}
                            </code>
                          </a>
                        ) : (
                          <code className="block text-sm bg-muted px-2 py-1 rounded mt-1 truncate">
                            {repo.latestVersion || 'N/A'}
                          </code>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {repo.lastCheckedAt ? new Date(repo.lastCheckedAt).toLocaleString() : t('repos.never')}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {repo.hasUpdate && (
                        <Button variant="default" size="sm" onClick={() => handleMarkUpdated(repo.id)} className="flex-1">
                          <Check className="mr-1 h-3 w-3" />
                          {t('repos.markUpdated')}
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setEditRepo({ id: repo.id, owner: repo.owner, repo: repo.repo, useGlobalCron: repo.useGlobalCron, cronExpression: repo.cronExpression || '0 */6 * * *', localVersion: repo.localVersion || '' })}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleCheck(repo.id)}>
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(repo.id, `${repo.owner}/${repo.repo}`)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Custom Cron Repos */}
      <Card>
        <CardHeader>
          <CardTitle>{t('repos.customCronRepos')} ({customCronRepos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {customCronRepos.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t('repos.noCustomCronRepos')}
            </p>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('repos.repository')}</TableHead>
                      <TableHead>{t('repos.localVersion')}</TableHead>
                      <TableHead>{t('repos.latestVersion')}</TableHead>
                      <TableHead>{t('repos.status')}</TableHead>
                      <TableHead>{t('repos.lastChecked')}</TableHead>
                      <TableHead className="text-right">{t('repos.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customCronRepos.map((repo) => (
                      <TableRow key={repo.id}>
                        <TableCell>
                          <div>
                            <a
                              href={repo.htmlUrl || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium hover:underline flex items-center gap-1"
                            >
                              {repo.owner}/{repo.repo}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            {repo.description && (
                              <p className="text-sm text-muted-foreground mt-1">{repo.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {repo.localVersion || 'N/A'}
                          </code>
                        </TableCell>
                        <TableCell>
                          {repo.latestVersionUrl ? (
                            <a
                              href={repo.latestVersionUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm hover:underline"
                            >
                              <code className="bg-muted px-2 py-1 rounded">{repo.latestVersion || 'N/A'}</code>
                            </a>
                          ) : (
                            <code className="text-sm bg-muted px-2 py-1 rounded">{repo.latestVersion || 'N/A'}</code>
                          )}
                        </TableCell>
                        <TableCell>
                          {repo.hasUpdate ? (
                            <Badge variant="success" className="whitespace-nowrap">{t('dashboard.updateAvailable')}</Badge>
                          ) : (
                            <Badge variant="secondary" className="whitespace-nowrap">{t('repos.upToDate')}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {repo.lastCheckedAt ? new Date(repo.lastCheckedAt).toLocaleString() : t('repos.never')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {repo.hasUpdate && (
                              <Button variant="default" size="sm" onClick={() => handleMarkUpdated(repo.id)}>
                                <Check className="mr-1 h-3 w-3" />
                                {t('repos.markUpdated')}
                              </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={() => setEditRepo({ id: repo.id, owner: repo.owner, repo: repo.repo, useGlobalCron: repo.useGlobalCron, cronExpression: repo.cronExpression || '0 */6 * * *', localVersion: repo.localVersion || '' })}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleCheck(repo.id)}>
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(repo.id, `${repo.owner}/${repo.repo}`)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden space-y-3">
                {customCronRepos.map((repo) => (
                  <div key={repo.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <a
                          href={repo.htmlUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:underline flex items-center gap-1 break-all"
                        >
                          {repo.owner}/{repo.repo}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                        {repo.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{repo.description}</p>
                        )}
                      </div>
                      {repo.hasUpdate ? (
                        <Badge variant="success" className="shrink-0 whitespace-nowrap">{t('dashboard.updateAvailable')}</Badge>
                      ) : (
                        <Badge variant="secondary" className="shrink-0 whitespace-nowrap">{t('repos.upToDate')}</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">{t('repos.localVersion')}</span>
                        <code className="block text-sm bg-muted px-2 py-1 rounded mt-1 truncate">
                          {repo.localVersion || 'N/A'}
                        </code>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('repos.latestVersion')}</span>
                        {repo.latestVersionUrl ? (
                          <a href={repo.latestVersionUrl} target="_blank" rel="noopener noreferrer">
                            <code className="block text-sm bg-muted px-2 py-1 rounded mt-1 hover:underline truncate">
                              {repo.latestVersion || 'N/A'}
                            </code>
                          </a>
                        ) : (
                          <code className="block text-sm bg-muted px-2 py-1 rounded mt-1 truncate">
                            {repo.latestVersion || 'N/A'}
                          </code>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {repo.lastCheckedAt ? new Date(repo.lastCheckedAt).toLocaleString() : t('repos.never')}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {repo.hasUpdate && (
                        <Button variant="default" size="sm" onClick={() => handleMarkUpdated(repo.id)} className="flex-1">
                          <Check className="mr-1 h-3 w-3" />
                          {t('repos.markUpdated')}
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setEditRepo({ id: repo.id, owner: repo.owner, repo: repo.repo, useGlobalCron: repo.useGlobalCron, cronExpression: repo.cronExpression || '0 */6 * * *', localVersion: repo.localVersion || '' })}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleCheck(repo.id)}>
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(repo.id, `${repo.owner}/${repo.repo}`)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {editRepo && (
        <EditRepoDialog
          open={!!editRepo}
          onOpenChange={(open) => !open && setEditRepo(null)}
          repo={editRepo}
          onSubmit={handleEdit}
          globalCron={globalCron}
        />
      )}
    </div>
  );
}
