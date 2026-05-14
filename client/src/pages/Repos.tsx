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
import { RefreshCw, Trash2, ExternalLink, Check, Pencil } from 'lucide-react';
import { useRepoStore } from '@/stores';
import { AddRepoDialog } from '@/components/AddRepoDialog';
import { EditRepoDialog } from '@/components/EditRepoDialog';
import { toast } from '@/components/ui/toast';
import { useI18nStore } from '@/i18n';

export function Repos() {
  const { repos, fetchRepos, addRepo, updateRepo, deleteRepo, markUpdated, triggerCheck } = useRepoStore();
  const { t } = useI18nStore();
  const [editRepo, setEditRepo] = useState<{ id: number; owner: string; repo: string; cronExpression: string; localVersion?: string } | null>(null);

  useEffect(() => {
    fetchRepos();
  }, [fetchRepos]);

  const handleAdd = async (owner: string, repo: string, cronExpression: string) => {
    try {
      await addRepo(owner, repo, cronExpression);
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

  const handleEdit = async (id: number, cronExpression: string, localVersion?: string) => {
    try {
      await updateRepo(id, { cronExpression, localVersion });
      toast({ title: t('repos.editSuccess') });
    } catch (err: any) {
      toast({ title: t('repos.editFailed'), description: err.message, variant: 'destructive' });
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('repos.title')}</h1>
        <AddRepoDialog onSubmit={handleAdd} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('repos.monitoredRepos')}</CardTitle>
        </CardHeader>
        <CardContent>
          {repos.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t('repos.noReposYet')}
            </p>
          ) : (
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
                {repos.map((repo) => (
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
                        <Badge variant="success">{t('dashboard.updateAvailable')}</Badge>
                      ) : (
                        <Badge variant="secondary">{t('repos.upToDate')}</Badge>
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
                        <Button variant="outline" size="sm" onClick={() => setEditRepo({ id: repo.id, owner: repo.owner, repo: repo.repo, cronExpression: repo.cronExpression || '0 */6 * * *', localVersion: repo.localVersion || '' })}>
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
          )}
        </CardContent>
      </Card>

      {editRepo && (
        <EditRepoDialog
          open={!!editRepo}
          onOpenChange={(open) => !open && setEditRepo(null)}
          repo={editRepo}
          onSubmit={handleEdit}
        />
      )}
    </div>
  );
}
