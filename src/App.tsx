import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import SignInPage from './pages/SignInPage';
import Toast from './components/ui/Toast';
import NorthstarMark from './components/ui/NorthstarMark';

/** Shown while the session and the state are on their way. */
function Splash() {
  return (
    <div className="auth" aria-busy="true">
      <NorthstarMark size={40} className="splash__mark" />
    </div>
  );
}
import { useStore } from './store/useStore';
import { todayISO } from './lib/dates';
import { funnel } from './lib/selectors';
import { auth, api, type User } from './lib/api';
import type { AppState } from './types';

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
  const [notice, setNotice] = useState<string | null>(null);

  // Both requests go out together. Asking who you are and then asking for
  // your data would put two round trips in front of the first paint; the
  // state request simply fails with 401 when nobody is signed in.
  useEffect(() => {
    const state = useStore.getState();
    void Promise.all([
      auth.me().catch(() => ({ user: null })),
      state.load().catch(() => undefined),
    ]).then(([r]) => {
      setUser(r.user);
      setChecked(true);
    });
  }, []);

  const applications = useStore((s) => s.applications);
  const override = useStore((s) => s.settings.todayOverride);
  const ready = useStore((s) => s.ready);
  const loadState = useStore((s) => s.load);
  const clearState = useStore((s) => s.clear);
  const error = useStore((s) => s.error);
  const clearError = useStore((s) => s.clearError);
  const today = todayISO(override);

  // Reloads when the person changes — signing in, or signing out.
  const signedInAs = user?.id ?? null;
  useEffect(() => {
    if (!checked) return;
    if (signedInAs) void loadState();
    else clearState();
  }, [signedInAs, checked, loadState, clearState]);

  // A failed write can happen on any page, so the message lives here.
  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(clearError, 4000);
    return () => window.clearTimeout(timer);
  }, [error, clearError]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function exportBackup() {
    const s = useStore.getState();
    const payload: AppState = {
      roadmap: s.roadmap,
      goals: s.goals,
      schedule: s.schedule,
      exceptions: s.exceptions,
      deferrals: s.deferrals,
      oss: s.oss,
      applications: s.applications,
      contacts: s.contacts,
      companies: s.companies,
      skills: s.skills,
      templates: s.templates,
      reviews: s.reviews,
      dailyLog: s.dailyLog,
      settings: s.settings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `northstar-backup-${today}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setNotice('Backup downloaded');
  }

  async function importBackup(file: File) {
    try {
      await api.import(JSON.parse(await file.text()) as AppState);
      // Every id changed, so take the state fresh rather than guessing.
      await loadState();
      setNotice('Backup restored');
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "That file isn't a Northstar backup");
    }
  }

  async function signOut() {
    await auth.logout().catch(() => undefined);
    setUser(null);
  }

  async function deleteAccount() {
    await auth.deleteAccount().catch(() => undefined);
    setUser(null);
  }

  const followupsDue = useMemo(() => funnel(applications, today).followupsDue, [applications, today]);

  if (!checked || (user && !ready)) return <Splash />;
  if (!user) return <SignInPage onSignedIn={setUser} />;

  return (
    <AppLayout
      page={page}
      setPage={setPage}
      followupsDue={followupsDue}
      email={user.email}
      isGuest={user.email.endsWith('@guest.northstar')}
      onExport={exportBackup}
      onImport={importBackup}
      onSignOut={signOut}
      onDeleteAccount={deleteAccount}
    >
      {/* Blank on purpose: these chunks load in milliseconds, and a spinner
          that flashes is worse than none. */}
      <Suspense fallback={<div className="page" aria-busy="true" />}>
        {page === 'dashboard' && (
          <DashboardPage setPage={setPage} />
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
      <Toast message={error ?? notice} />
    </AppLayout>
  );
}

export default App;
