import {
  Building2,
  CalendarDays,
  LayoutDashboard,
  Palette,
  Route,
  Send,
  Sparkles,
  Users,
  BookOpen,
} from 'lucide-react';
import type { PageKey } from '../../App';

type Props = {
  page: PageKey;
  setPage: (p: PageKey) => void;
  open: boolean;
  followupsDue: number;
};

const NAV: { key: PageKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'schedule', label: 'Schedule', icon: CalendarDays },
  { key: 'roadmap', label: 'Roadmap', icon: Route },
  { key: 'applications', label: 'Applications', icon: Send },
  { key: 'networking', label: 'Networking', icon: Users },
  { key: 'companies', label: 'Companies', icon: Building2 },
  { key: 'resources', label: 'Resources', icon: BookOpen },
  { key: 'components', label: 'Components', icon: Palette },
];

function Sidebar({ page, setPage, open, followupsDue }: Props) {
  return (
    <aside className={`sidebar ${open ? 'sidebar--open' : ''}`.trim()}>
      <div className="sidebar__brand">
        <span className="sidebar__mark">
          <Sparkles size={17} />
        </span>
        <span>
          <span className="sidebar__name">Career Transition OS</span>
          <br />
          <span className="sidebar__tag">Build. Apply. Repeat.</span>
        </span>
      </div>

      <nav>
        {NAV.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`navbtn ${page === key ? 'navbtn--active' : ''}`.trim()}
            onClick={() => setPage(key)}
            aria-current={page === key ? 'page' : undefined}
          >
            <Icon size={16} />
            {label}
            {key === 'applications' && followupsDue > 0 && (
              <span className="navbtn__count" title="Follow-ups due">
                {followupsDue}
              </span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
