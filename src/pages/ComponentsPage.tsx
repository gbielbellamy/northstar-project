import { Check, Sparkles } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import ProgressRing from '../components/ui/ProgressRing';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';
import Checkbox from '../components/ui/Checkbox';
import AnimatedSection from '../components/ui/AnimatedSection';
import { AREAS } from '../types';
import { areaClass } from '../lib/ui';

const CORE_TOKENS = [
  { name: 'Accent', v: '--accent' },
  { name: 'Accent bg', v: '--accent-bg' },
  { name: 'Background', v: '--bg' },
  { name: 'Background soft', v: '--bg-soft' },
  { name: 'Border', v: '--border' },
  { name: 'Text', v: '--text' },
  { name: 'Text heading', v: '--text-h' },
  { name: 'Success', v: '--ok' },
  { name: 'Warning', v: '--warn' },
  { name: 'Danger', v: '--danger' },
  { name: 'Info', v: '--info' },
  { name: 'Code bg', v: '--code-bg' },
];

const AREA_TOKENS = [
  { name: 'Project', v: '--area-project' },
  { name: 'Learning', v: '--area-learning' },
  { name: 'Job Search', v: '--area-jobsearch' },
  { name: 'Networking', v: '--area-networking' },
  { name: 'Interview Prep', v: '--area-interview' },
  { name: 'Portfolio', v: '--area-portfolio' },
  { name: 'Review', v: '--area-review' },
];

function Swatch({ name, v }: { name: string; v: string }) {
  return (
    <div>
      <div className="swatch__chip" style={{ background: `var(${v})` }} />
      <div className="swatch__name">{name}</div>
      <div className="swatch__var">{v}</div>
    </div>
  );
}

function ComponentsPage() {
  return (
    <div className="page">
      <div className="page__head">
        <h1>Components</h1>
        <p className="page__sub">
          The design system this app is built from — every colour, control and pattern in one place. It carries
          over from the dashboard project: same purple accent, same automatic dark mode driven by CSS custom
          properties. Toggle your OS theme and this whole page follows without a single line of JavaScript.
        </p>
      </div>

      <div className="section">
        <h2>Core tokens</h2>
        <span className="muted">Defined once in index.css, referenced everywhere else.</span>
      </div>
      <div className="swatch-grid">
        {CORE_TOKENS.map((t) => (
          <Swatch key={t.v} {...t} />
        ))}
      </div>

      <div className="section">
        <h2>Area colours</h2>
        <span className="muted">One hue per area, so a week reads at a glance.</span>
      </div>
      <div className="swatch-grid">
        {AREA_TOKENS.map((t) => (
          <Swatch key={t.v} {...t} />
        ))}
      </div>
      <Card className="card--hover" >
        <div className="legend">
          {AREAS.map((a) => (
            <span key={a} className={`area-chip ${areaClass(a)}`}>
              <span className="area-dot" />
              {a}
            </span>
          ))}
        </div>
      </Card>

      <div className="section">
        <h2>Typography</h2>
      </div>
      <Card>
        <div className="stack">
          <h1 style={{ margin: 0 }}>Heading 1 — 30px</h1>
          <h2 style={{ margin: 0 }}>Heading 2 — 20px</h2>
          <h3 style={{ margin: 0 }}>Heading 3 — 15px</h3>
          <p>Body — system-ui, 16px, 145% line height.</p>
          <p className="muted">Muted — 12.5px, used for secondary detail.</p>
          <p>
            <code>Monospace — ui-monospace, for tokens and code</code>
          </p>
        </div>
      </Card>

      <div className="section">
        <h2>Buttons</h2>
      </div>
      <Card>
        <div className="row">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" size="sm">
            Small
          </Button>
          <Button variant="primary">
            <Check size={14} /> With icon
          </Button>
          <Button variant="secondary" disabled>
            Disabled
          </Button>
        </div>
      </Card>

      <div className="section">
        <h2>Badges</h2>
      </div>
      <Card>
        <div className="row">
          <Badge variant="success" dot>
            Done
          </Badge>
          <Badge variant="warning" dot>
            In progress
          </Badge>
          <Badge variant="error" dot>
            Blocked
          </Badge>
          <Badge variant="muted" dot>
            Not started
          </Badge>
          <Badge variant="info">Applied</Badge>
          <Badge variant="neutral">This week</Badge>
        </div>
      </Card>

      <div className="section">
        <h2>Form controls</h2>
      </div>
      <Card>
        <div className="form-grid">
          <label className="field">
            <span className="field__label">Text input</span>
            <input className="input" placeholder="Placeholder" readOnly />
          </label>
          <label className="field">
            <span className="field__label">Select</span>
            <select className="select" defaultValue="One">
              <option>One</option>
              <option>Two</option>
            </select>
          </label>
          <label className="field full">
            <span className="field__label">Textarea</span>
            <textarea className="textarea" placeholder="Multi-line" readOnly />
          </label>
          <div className="full stack" style={{ gap: 8 }}>
            <Checkbox checked onChange={() => {}} label="Checkbox — the box always sits left of its label" />
            <Checkbox checked={false} onChange={() => {}} label="Unchecked" />
          </div>
        </div>
      </Card>

      <div className="section">
        <h2>Progress</h2>
      </div>
      <div className="grid-2">
        <Card title="Bar">
          <div className="stack">
            <ProgressBar value={72} />
            <ProgressBar value={40} color="var(--area-jobsearch)" />
            <ProgressBar value={16} color="var(--danger)" small />
          </div>
        </Card>
        <Card title="Ring">
          <div className="hero__ring" style={{ justifyItems: 'start' }}>
            <ProgressRing value={68} size={92} />
            <div className="hero__ring-label" style={{ left: 46, transform: 'translateX(-50%)' }}>
              <div className="hero__ring-pct">68%</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="section">
        <h2>Stat cards</h2>
      </div>
      <div className="stat-grid">
        <StatCard label="Applications sent" value={24} desc="Across 6 weeks" icon={<Sparkles size={15} />} />
        <StatCard
          label="Response rate"
          value="21%"
          desc="5 of 24 came back"
          icon={<Sparkles size={15} />}
          color="var(--area-jobsearch)"
          index={1}
        />
        <StatCard
          label="Follow-ups due"
          value={3}
          desc="Chase them today"
          icon={<Sparkles size={15} />}
          color="var(--danger)"
          index={2}
        />
        <StatCard
          label="Tier A companies"
          value={17}
          desc="Apply here first"
          icon={<Sparkles size={15} />}
          color="var(--area-learning)"
          index={3}
        />
      </div>

      <div className="section">
        <h2>Empty state</h2>
      </div>
      <EmptyState
        icon={<Sparkles size={19} />}
        title="Nothing here yet"
        text="Every table falls back to one of these, with a sentence that says what to do next rather than just 'no data'."
        action={<Button variant="primary">Primary action</Button>}
      />

      <div className="section">
        <h2>Motion</h2>
        <span className="muted">All of it respects prefers-reduced-motion.</span>
      </div>
      <div className="grid-3">
        {[0, 1, 2].map((i) => (
          <AnimatedSection key={i} delay={i * 0.1}>
            <Card title={`Staggered card ${i + 1}`} hover>
              <p className="muted">
                Fades up with a {i * 100}ms delay, then lifts on hover. Reload the page to replay.
              </p>
            </Card>
          </AnimatedSection>
        ))}
      </div>
    </div>
  );
}

export default ComponentsPage;
