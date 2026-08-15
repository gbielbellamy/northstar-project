import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import SignInPage from './pages/SignInPage';
import Toast from './components/ui/Toast';
import { useStore } from './store/useStore';
import { todayISO } from './lib/dates';
import { funnel } from './lib/selectors';
import { auth, type User } from './lib/api';

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
  const [user, setUser] = useState<User | null>(null);
  // Undecided until /me answers, so the app does not flash the sign-in screen
  // at someone who is already signed in.
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    auth
      .me()
      .then((r) => setUser(r.user))
      .catch(() => setUser(null))
      .finally(() => setChecked(true));
  }, []);

  const applications = useStore((s) => s.applications);
  const override = useStore((s) => s.settings.todayOverride);
  const ready = useStore((s) => s.ready);
  const loadState = useStore((s) => s.load);
  const clearState = useStore((s) => s.clear);
  const error = useStore((s) => s.error);
  const clearError = useStore((s) => s.clearError);
  const today = todayISO(override);

  // The state belongs to whoever is signed in, so it is fetched once they are
  // and dropped the moment they are not.
  useEffect(() => {
    if (user) void loadState();
    else clearState();
  }, [user, loadState, clearState]);

  // A failed write can happen on any page, so the message lives here.
  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(clearError, 4000);
    return () => window.clearTimeout(timer);
  }, [error, clearError]);

  async function signOut() {
    await auth.logout().catch(() => undefined);
    setUser(null);
  }

  async function deleteAccount() {
    await auth.deleteAccount().catch(() => undefined);
    setUser(null);
  }

  const followupsDue = useMemo(() => funnel(applications, today).followupsDue, [applications, today]);

  if (!checked) return <div className="auth" aria-busy="true" />;
  if (!user) return <SignInPage onSignedIn={setUser} />;
  if (!ready) return <div className="page" aria-busy="true" />;

  return (
    <AppLayout page={page} setPage={setPage} followupsDue={followupsDue}>
      {/* Blank on purpose: these chunks load in milliseconds, and a spinner
          that flashes is worse than none. */}
      <Suspense fallback={<div className="page" aria-busy="true" />}>
        {page === 'dashboard' && (
          <DashboardPage setPage={setPage} onSignOut={signOut} onDeleteAccount={deleteAccount} />
        )}
        {page === 'schedule' && <SchedulePage />}
        {page === 'roadmap' && <RoadmapPage />}
        {page === 'applications' && <ApplicationsPage />}
        {page === 'networking' && <NetworkingPage />}
        {page === 'companies' && <CompaniesPage />}
        {page === 'contributions' && <ContributionsPage />}
        {page === 'resources' && <ResourcesPage />}
        {page === 'components' && <ComponentsPage />}
      </Suspense>
      <Toast message={error} />
    </AppLayout>
  );
}

export default App;
