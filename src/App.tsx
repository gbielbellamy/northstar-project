import { Suspense, lazy, useMemo, useState } from 'react';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import { useStore } from './store/useStore';
import { todayISO } from './lib/dates';
import { funnel } from './lib/selectors';

/**
 * Only the dashboard is bundled up front, since it is where every visit
 * starts. The rest arrive when you first open them — which keeps the icon set
 * behind Resources, and the design-system catalogue behind Components, out of
 * the initial download.
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
      {/* Deliberately blank: on a local network these chunks land in a few
          milliseconds, and a spinner that flashes reads worse than nothing. */}
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
