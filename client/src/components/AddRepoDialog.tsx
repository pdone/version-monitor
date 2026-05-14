import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { useI18nStore } from '@/i18n';

interface AddRepoDialogProps {
  onSubmit: (owner: string, repo: string, cronExpression: string) => Promise<void>;
}

export function AddRepoDialog({ onSubmit }: AddRepoDialogProps) {
  const { t } = useI18nStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [cronExpression, setCronExpression] = useState('0 */6 * * *');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit(owner, repo, cronExpression);
      setOpen(false);
      setOwner('');
      setRepo('');
      setCronExpression('0 */6 * * *');
    } catch (err: any) {
      setError(err.message || t('repos.addFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t('repos.addRepo')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('addRepoDialog.title')}</DialogTitle>
            <DialogDescription>{t('addRepoDialog.description')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="owner">{t('addRepoDialog.owner')}</Label>
                <Input
                  id="owner"
                  placeholder={t('addRepoDialog.ownerPlaceholder')}
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repo">{t('addRepoDialog.repo')}</Label>
                <Input
                  id="repo"
                  placeholder={t('addRepoDialog.repoPlaceholder')}
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cron">{t('addRepoDialog.cronExpression')}</Label>
              <Input
                id="cron"
                placeholder="0 */6 * * *"
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                {t('addRepoDialog.cronHelp').split('{link}')[0]}
                <a
                  href="https://crontab.guru"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  crontab.guru
                </a>
                {t('addRepoDialog.cronHelp').split('{link}')[1]}
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? t('addRepoDialog.adding') : t('addRepoDialog.add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
