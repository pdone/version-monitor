import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, GitBranch, Settings, PanelLeftClose, PanelLeft, Menu, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18nStore } from '@/i18n';
import { Button } from './ui/button';

export function Layout() {
  const location = useLocation();
  const { t } = useI18nStore();
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navItems = [
    { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/repos', label: t('nav.repositories'), icon: GitBranch },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  const sidebarContent = (
    <>
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
          onClick={() => {
            const next = !collapsed;
            setCollapsed(next);
            localStorage.setItem('sidebar-collapsed', String(next));
          }}
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
      <div className="border-t p-2">
        <Link
          to="/about"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
            location.pathname === '/about'
              ? 'bg-background text-foreground'
              : 'text-muted-foreground hover:bg-background hover:text-foreground',
            collapsed && 'justify-center px-0'
          )}
          title={collapsed ? t('nav.about') : undefined}
        >
          <Info className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="whitespace-nowrap">{t('nav.about')}</span>}
        </Link>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={cn(
          'flex flex-col border-r bg-muted transition-all duration-300',
          collapsed ? 'w-16' : 'w-64',
          'max-md:hidden'
        )}
      >
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'flex flex-col border-r bg-muted transition-all duration-300 fixed inset-y-0 left-0 z-50 md:hidden',
          mobileOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full'
        )}
      >
        <div className="flex h-14 items-center border-b px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold flex-1 overflow-hidden">
            <GitBranch className="h-5 w-5 shrink-0" />
            <span className="whitespace-nowrap">Version Monitor</span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setMobileOpen(false)}
          >
            <PanelLeftClose className="h-4 w-4" />
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
                  : 'text-muted-foreground hover:bg-background hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="border-t p-2">
          <Link
            to="/about"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              location.pathname === '/about'
                ? 'bg-background text-foreground'
                : 'text-muted-foreground hover:bg-background hover:text-foreground'
            )}
          >
            <Info className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">{t('nav.about')}</span>
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="flex items-center border-b px-4 h-14 md:hidden">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 mr-2"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <GitBranch className="h-5 w-5 shrink-0" />
            <span className="whitespace-nowrap">Version Monitor</span>
          </Link>
        </div>
        <div className="container mx-auto p-4 md:p-6 min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
