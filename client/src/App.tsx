import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Layout } from '@/components/Layout';
import { Toaster } from '@/components/ui/toast';
import { AccessGuard } from '@/components/AccessGuard';
import { Dashboard } from '@/pages/Dashboard';
import { Repos } from '@/pages/Repos';
import { Settings } from '@/pages/Settings';
import { About } from '@/pages/About';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="version-monitor-theme">
      <AccessGuard>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="repos" element={<Repos />} />
              <Route path="settings" element={<Settings />} />
              <Route path="about" element={<About />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AccessGuard>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
