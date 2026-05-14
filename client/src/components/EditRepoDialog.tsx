import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18nStore } from '@/i18n';

interface EditRepoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repo: {
    id: number;
    owner: string;
    repo: string;
    cronExpression: string;
    localVersion?: string;
  };
  onSubmit: (id: number, cronExpression: string, localVersion?: string) => Promise<void>;
}

export function EditRepoDialog({ open, onOpenChange, repo, onSubmit }: EditRepoDialogProps) {
  const { t } = useI18nStore();
  const [loading, setLoading] = useState(false);
  const [cronExpression, setCronExpression] = useState(repo.cronExpression || '0 */6 * * *');
  const [localVersion, setLocalVersion] = useState(repo.localVersion || '');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit(repo.id, cronExpression, localVersion || undefined);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || t('repos.addFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('editRepoDialog.title')}</DialogTitle>
            <DialogDescription>
              {repo.owner}/{repo.repo}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-local-version">{t('editRepoDialog.localVersion')}</Label>
              <Input
                id="edit-local-version"
                placeholder={t('editRepoDialog.localVersionPlaceholder')}
                value={localVersion}
                onChange={(e) => setLocalVersion(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t('editRepoDialog.localVersionHelp')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cron">{t('editRepoDialog.cronExpression')}</Label>
              <Input
                id="edit-cron"
                placeholder="0 */6 * * *"
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                {t('editRepoDialog.cronHelp').split('{link}')[0]}
                <a
                  href="https://crontab.guru"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  crontab.guru
                </a>
                {t('editRepoDialog.cronHelp').split('{link}')[1]}
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? t('editRepoDialog.saving') : t('editRepoDialog.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
