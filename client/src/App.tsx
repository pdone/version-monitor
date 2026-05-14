import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Layout } from '@/components/Layout';
import { Toaster } from '@/components/ui/toast';
import { Dashboard } from '@/pages/Dashboard';
import { Repos } from '@/pages/Repos';
import { Settings } from '@/pages/Settings';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="version-monitor-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="repos" element={<Repos />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
