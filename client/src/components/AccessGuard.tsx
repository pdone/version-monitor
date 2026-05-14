import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useI18nStore } from '@/i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Lock } from 'lucide-react';

interface AccessGuardProps {
  children: React.ReactNode;
}

export function AccessGuard({ children }: AccessGuardProps) {
  const { isAuthenticated, isLoading, checkAuth, verify } = useAuthStore();
  const { t } = useI18nStore();
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setError('');

    const success = await verify(password, remember);
    if (!success) {
      setError(t('auth.invalidPassword'));
    }
    setVerifying(false);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <Dialog open={!isAuthenticated} modal>
      <DialogContent
        className="sm:max-w-[400px]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">{t('auth.title')}</DialogTitle>
          <DialogDescription className="text-center">
            {t('auth.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="access-password">{t('auth.password')}</Label>
            <Input
              id="access-password"
              type="password"
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember-me"
              checked={remember}
              onCheckedChange={(checked) => setRemember(checked === true)}
            />
            <Label htmlFor="remember-me" className="text-sm font-normal cursor-pointer">
              {t('auth.rememberMe')}
            </Label>
          </div>
          <Button type="submit" className="w-full" disabled={verifying}>
            {verifying ? t('auth.verifying') : t('auth.submit')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
