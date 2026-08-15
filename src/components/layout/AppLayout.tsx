import { useState, type ReactNode } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import ThemeToggle from '../ui/ThemeToggle';
import type { PageKey } from '../../App';

type Props = {
  page: PageKey;
  setPage: (p: PageKey) => void;
  followupsDue: number;
  email: string;
  isGuest: boolean;
  onExport: () => void;
  onImport: (file: File) => void;
  onSignOut: () => void;
  onDeleteAccount: () => void;
  children: ReactNode;
};

function AppLayout({
  page,
  setPage,
  followupsDue,
  email,
  isGuest,
  onExport,
  onImport,
  onSignOut,
  onDeleteAccount,
  children,
}: Props) {
  const [navOpen, setNavOpen] = useState(false);

  const go = (p: PageKey) => {
    setPage(p);
    setNavOpen(false);
  };

  return (
    <div className="layout">
      {/* Skips the nine nav links. Hidden until focused. */}
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <button
        className="hamburger"
        onClick={() => setNavOpen((v) => !v)}
        aria-label="Menu"
        aria-expanded={navOpen}
        aria-controls="sidebar"
      >
        <Menu size={18} />
      </button>
      {/* Pinned top-right on every page. */}
      <ThemeToggle />
      {navOpen && <div className="overlay" onClick={() => setNavOpen(false)} />}
      <Sidebar
        page={page}
        setPage={go}
        open={navOpen}
        followupsDue={followupsDue}
        email={email}
        isGuest={isGuest}
        onExport={onExport}
        onImport={onImport}
        onSignOut={onSignOut}
        onDeleteAccount={onDeleteAccount}
      />
      <main className="layout__main" id="main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}

export default AppLayout;
