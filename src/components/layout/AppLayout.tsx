import { useState, type ReactNode } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import ThemeToggle from '../ui/ThemeToggle';
import type { PageKey } from '../../App';

type Props = {
  page: PageKey;
  setPage: (p: PageKey) => void;
  followupsDue: number;
  children: ReactNode;
};

function AppLayout({ page, setPage, followupsDue, children }: Props) {
  const [navOpen, setNavOpen] = useState(false);

  const go = (p: PageKey) => {
    setPage(p);
    setNavOpen(false);
  };

  return (
    <div className="layout">
      {/* Nine nav links stand between the keyboard and the page itself. This
          stays hidden until it is focused, which is the only time it matters. */}
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
      {/* Pinned top-right on every page, so it never moves. */}
      <ThemeToggle />
      {navOpen && <div className="overlay" onClick={() => setNavOpen(false)} />}
      <Sidebar page={page} setPage={go} open={navOpen} followupsDue={followupsDue} />
      <main className="layout__main" id="main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}

export default AppLayout;
