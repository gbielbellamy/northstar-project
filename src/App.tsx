import { Suspense, lazy, useMemo, useState } from 'react';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import { useStore } from './store/useStore';
import { todayISO } from './lib/dates';
import { funnel } from './lib/selectors';

/**
 * Only the dashboard is in the initial bundle. The rest load on first open,
 * which keeps the icon set and the component catalogue out of the first load.
 */
const SchedulePage = lazy(() => import('./pages/SchedulePage'));
const RoadmapPage = lazy(() => import('./pages/RoadmapPage'));
const ApplicationsPage = lazy(() => import('./pages/ApplicationsPage'));
const NetworkingPage = lazy(() => import('./pages/NetworkingPage'));
const CompaniesPage = lazy(() => import('./pages/CompaniesPage'));
const ContributionsPage = lazy(() => import('./pages/ContributionsPage'));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage'));
const ComponentsPage = lazy(() => import('./pages/ComponentsPage'));

export type PageKey =
  | 'dashboard'
  | 'schedule'
  | 'roadmap'
  | 'applications'
  | 'networking'
  | 'companies'
  | 'contributions'
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
      {/* Blank on purpose: these chunks load in milliseconds, and a spinner
          that flashes is worse than none. */}
      <Suspense fallback={<div className="page" aria-busy="true" />}>
        {page === 'dashboard' && <DashboardPage setPage={setPage} />}
        {page === 'schedule' && <SchedulePage />}
        {page === 'roadmap' && <RoadmapPage />}
        {page === 'applications' && <ApplicationsPage />}
        {page === 'networking' && <NetworkingPage />}
        {page === 'companies' && <CompaniesPage />}
        {page === 'contributions' && <ContributionsPage />}
        {page === 'resources' && <ResourcesPage />}
        {page === 'components' && <ComponentsPage />}
      </Suspense>
    </AppLayout>
  );
}

export default App;
