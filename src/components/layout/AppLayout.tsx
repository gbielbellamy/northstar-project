import { useState, type ReactNode } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
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
      <button className="hamburger" onClick={() => setNavOpen((v) => !v)} aria-label="Menu">
        <Menu size={18} />
      </button>
      {navOpen && <div className="overlay" onClick={() => setNavOpen(false)} />}
      <Sidebar page={page} setPage={go} open={navOpen} followupsDue={followupsDue} />
      <main className="layout__main">{children}</main>
    </div>
  );
}

export default AppLayout;
