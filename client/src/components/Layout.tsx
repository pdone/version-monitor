import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, GitBranch, Settings, PanelLeftClose, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18nStore } from '@/i18n';
import { Button } from './ui/button';

export function Layout() {
  const location = useLocation();
  const { t } = useI18nStore();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/repos', label: t('nav.repositories'), icon: GitBranch },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={cn(
          'flex flex-col border-r bg-muted/40 transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex h-14 items-center border-b px-4">
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2 font-semibold flex-1 overflow-hidden">
              <GitBranch className="h-5 w-5 shrink-0" />
              <span className="whitespace-nowrap">Version Monitor</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0", collapsed && "mx-auto")}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                location.pathname === item.to
                  ? 'bg-background text-foreground'
                  : 'text-muted-foreground hover:bg-background hover:text-foreground',
                collapsed && 'justify-center px-0'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
