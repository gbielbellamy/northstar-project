import { useMemo, useState } from 'react';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import SchedulePage from './pages/SchedulePage';
import RoadmapPage from './pages/RoadmapPage';
import ApplicationsPage from './pages/ApplicationsPage';
import NetworkingPage from './pages/NetworkingPage';
import CompaniesPage from './pages/CompaniesPage';
import ResourcesPage from './pages/ResourcesPage';
import ComponentsPage from './pages/ComponentsPage';
import { useStore } from './store/useStore';
import { todayISO } from './lib/dates';
import { funnel } from './lib/selectors';

export type PageKey =
  | 'dashboard'
  | 'schedule'
  | 'roadmap'
  | 'applications'
  | 'networking'
  | 'companies'
  | 'resources'
  | 'components';

function App() {
  const [page, setPage] = useState<PageKey>('dashboard');

  const applications = useStore((s) => s.applications);
  const override = useStore((s) => s.settings.todayOverride);
  const today = todayISO(override);

  const followupsDue = useMemo(() => funnel(applications, today).followupsDue, [applications, today]);

  return (
    <AppLayout page={page} setPage={setPage} followupsDue={followupsDue}>
      {page === 'dashboard' && <DashboardPage setPage={setPage} />}
      {page === 'schedule' && <SchedulePage />}
      {page === 'roadmap' && <RoadmapPage />}
      {page === 'applications' && <ApplicationsPage />}
      {page === 'networking' && <NetworkingPage />}
      {page === 'companies' && <CompaniesPage />}
      {page === 'resources' && <ResourcesPage />}
      {page === 'components' && <ComponentsPage />}
    </AppLayout>
  );
}

export default App;
