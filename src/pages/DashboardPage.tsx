import { useMemo, useRef, useState } from 'react';
import {
  AlarmClock,
  ArrowRight,
  Building2,
  CalendarCheck,
  Download,
  MessageSquare,
  RotateCcw,
  Send,
  Target,
  TrendingUp,
  Upload,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { completionPct, funnel, goalsForWeek, outreachStats } from '../lib/selectors';
import { currentWeekNumber, dayKeyOf, fmtLong, fmtRange, hoursBetween, todayISO } from '../lib/dates';
import { areaClass } from '../lib/ui';
import type { AppState, Area } from '../types';
import type { PageKey } from '../App';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatCard from '../components/ui/StatCard';
import ProgressRing from '../components/ui/ProgressRing';
import AnimatedSection from '../components/ui/AnimatedSection';
import Toast from '../components/ui/Toast';
import FunnelChart from '../components/charts/FunnelChart';
import HoursChart, { type HourSlice } from '../components/charts/HoursChart';
import WeekProgressChart from '../components/charts/WeekProgressChart';

const AREA_COLOR: Record<Area, string> = {
  Project: 'var(--area-project)',
  Learning: 'var(--area-learning)',
  'Job Search': 'var(--area-jobsearch)',
  Networking: 'var(--area-networking)',
  'Interview Prep': 'var(--area-interview)',
  Portfolio: 'var(--area-portfolio)',
  Review: 'var(--area-review)',
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

type Props = { setPage: (p: PageKey) => void };

function DashboardPage({ setPage }: Props) {
  const state = useStore();
  const { roadmap, goals, schedule, applications, contacts, companies, dailyLog, settings } = state;
  const replaceAll = useStore((s) => s.replaceAll);
  const reset = useStore((s) => s.reset);

  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const today = todayISO(settings.todayOverride);
  const week = currentWeekNumber(roadmap, today);
  const rw = roadmap.find((r) => r.week === week);

  const f = useMemo(() => funnel(applications, today), [applications, today]);
  const o = useMemo(() => outreachStats(contacts, today), [contacts, today]);
  const weekPct = completionPct(goals, week);

  const todayBlocks = useMemo(() => {
    const dk = dayKeyOf(today);
    return schedule
      .filter((b) => b.day === dk && b.area !== null)
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [schedule, today]);

  const todayDone = todayBlocks.filter((b) => dailyLog[today]?.[b.id]).length;

  const hourSlices: HourSlice[] = useMemo(() => {
    const byArea = new Map<Area, number>();
    for (const b of schedule) {
      if (!b.area || b.optional) continue;
      byArea.set(b.area, (byArea.get(b.area) ?? 0) + hoursBetween(b.start, b.end));
    }
    return [...byArea.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([area, value]) => ({ name: area, value: Math.round(value * 10) / 10, color: AREA_COLOR[area] }));
  }, [schedule]);

  const weekPoints = useMemo(
    () =>
      [...roadmap]
        .sort((a, b) => a.week - b.week)
        .map((r) => ({ week: `W${r.week}`, done: completionPct(goals, r.week) })),
    [roadmap, goals],
  );

  const tierA = companies.filter((c) => c.priority === 'A').length;
  const weekGoals = goalsForWeek(goals, week);
  const doneGoals = weekGoals.filter((g) => g.status === 'Done').length;

  function exportBackup() {
    const payload: AppState = {
      roadmap: state.roadmap,
      goals: state.goals,
      schedule: state.schedule,
      applications: state.applications,
      contacts: state.contacts,
      companies: state.companies,
      skills: state.skills,
      templates: state.templates,
      reviews: state.reviews,
      dailyLog: state.dailyLog,
      settings: state.settings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `career-os-backup-${today}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setToast('Backup downloaded');
    setTimeout(() => setToast(null), 1800);
  }

  function importBackup(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as AppState;
        if (!parsed.roadmap || !parsed.goals) throw new Error('missing keys');
        replaceAll(parsed);
        setToast('Backup restored');
      } catch {
        setToast("That file isn't a Career OS backup");
      }
      setTimeout(() => setToast(null), 2200);
    };
    reader.readAsText(file);
  }

  return (
    <div className="page">
      <AnimatedSection>
        <div className="hero">
          <div className="hero__body">
            <div className="hero__eyebrow">
              Week {week} of {roadmap.length} · {rw ? fmtRange(rw.start, rw.end) : ''}
            </div>
            <h1 className="hero__title">
              {greeting()}. {rw?.theme ?? 'Let’s go'}.
            </h1>
            <p className="hero__meta">
              {fmtLong(today)} — {todayBlocks.length} blocks planned, {todayDone} done.{' '}
              {todayDone === todayBlocks.length && todayBlocks.length > 0
                ? 'That’s the day closed out. Well done.'
                : 'Open the schedule and take the next one.'}
            </p>
            <div className="row" style={{ marginTop: 14 }}>
              <Button variant="primary" onClick={() => setPage('schedule')}>
                Today’s plan <ArrowRight size={14} />
              </Button>
              <Button onClick={() => setPage('applications')}>Log an application</Button>
            </div>
          </div>
          <div className="hero__ring">
            <ProgressRing value={weekPct} />
            <div className="hero__ring-label">
              <div className="hero__ring-pct">{weekPct}%</div>
              <div className="hero__ring-cap">
                {doneGoals}/{weekGoals.length} goals
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <div className="section">
        <h2>The search</h2>
        <span className="muted">Response rate is the number that tells you if your targeting works.</span>
      </div>
      <div className="stat-grid">
        <StatCard
          index={0}
          label="Applications sent"
          value={f.sent}
          desc={`${f.total} tracked in total`}
          icon={<Send size={15} />}
          color="var(--area-jobsearch)"
        />
        <StatCard
          index={1}
          label="Response rate"
          value={f.responseRate === null ? '—' : `${f.responseRate}%`}
          desc={f.sent === 0 ? 'Send the first one' : `${f.responded} of ${f.sent} came back`}
          icon={<TrendingUp size={15} />}
          color="var(--area-project)"
        />
        <StatCard
          index={2}
          label="Live conversations"
          value={f.active}
          desc={`${f.interviewing} interviewing · ${f.offers} offer${f.offers === 1 ? '' : 's'}`}
          icon={<Target size={15} />}
          color="var(--area-interview)"
        />
        <StatCard
          index={3}
          label="Follow-ups due"
          value={f.followupsDue + o.followupsDue}
          desc="Applications and contacts combined"
          icon={<AlarmClock size={15} />}
          color={f.followupsDue + o.followupsDue > 0 ? 'var(--danger)' : 'var(--muted-dot)'}
        />
        <StatCard
          index={4}
          label="People contacted"
          value={o.contacted}
          desc={`${o.totalTargets} targets loaded`}
          icon={<MessageSquare size={15} />}
          color="var(--area-networking)"
        />
        <StatCard
          index={5}
          label="Replies"
          value={o.replied}
          desc={`${o.meetings} meeting${o.meetings === 1 ? '' : 's'} scheduled`}
          icon={<CalendarCheck size={15} />}
          color="var(--area-review)"
        />
        <StatCard
          index={6}
          label="Tier A companies"
          value={tierA}
          desc={`${companies.length} in the list`}
          icon={<Building2 size={15} />}
          color="var(--area-learning)"
        />
        <StatCard
          index={7}
          label="Programme progress"
          value={`${completionPct(goals)}%`}
          desc={`${goals.filter((g) => g.status === 'Done').length} of ${goals.length} goals`}
          icon={<Target size={15} />}
          color="var(--area-portfolio)"
        />
      </div>

      <div className="section">
        <h2>Trends</h2>
      </div>
      <div className="grid-3">
        <AnimatedSection delay={0.05}>
          <Card title="Application funnel">
            {f.total === 0 ? (
              <p className="muted" style={{ padding: '52px 0', textAlign: 'center' }}>
                No applications yet — the chart fills in as you log them.
              </p>
            ) : (
              <FunnelChart data={f} />
            )}
          </Card>
        </AnimatedSection>
        <AnimatedSection delay={0.1}>
          <Card title="Where the week goes (37.5 h)">
            <HoursChart data={hourSlices} />
          </Card>
        </AnimatedSection>
        <AnimatedSection delay={0.15}>
          <Card title="Completion by week">
            <WeekProgressChart data={weekPoints} />
          </Card>
        </AnimatedSection>
      </div>

      <div className="section">
        <h2>Today</h2>
        <Button variant="ghost" onClick={() => setPage('schedule')}>
          Full schedule <ArrowRight size={13} />
        </Button>
      </div>
      <div className="stack">
        {todayBlocks.length === 0 ? (
          <Card>
            <p className="muted">Nothing scheduled today. Weekends are optional — rest counts.</p>
          </Card>
        ) : (
          todayBlocks.map((b, i) => {
            const goal = weekGoals.find((g) => g.area === b.area);
            const done = Boolean(dailyLog[today]?.[b.id]);
            return (
              <AnimatedSection key={b.id} delay={0.03 * i}>
                <div className={`block ${areaClass(b.area)} ${done ? 'block--done' : ''}`.trim()}>
                  <div>
                    <div className="block__time">
                      {b.start}–{b.end}
                    </div>
                    <div className="block__dur">{hoursBetween(b.start, b.end)} h</div>
                  </div>
                  <div>
                    <div className="area-chip">
                      <span className="area-dot" />
                      {b.area}
                    </div>
                    <div className="block__title">{goal?.title ?? b.label}</div>
                    <p className="block__detail">{goal?.detail ?? ''}</p>
                  </div>
                  <div className="block__side" />
                </div>
              </AnimatedSection>
            );
          })
        )}
      </div>

      <div className="section">
        <h2>Your data</h2>
      </div>
      <Card>
        <p className="muted" style={{ marginBottom: 12 }}>
          Everything lives in this browser only — nothing is sent anywhere. Export a backup before clearing
          site data or switching machines.
        </p>
        <div className="row">
          <Button onClick={exportBackup}>
            <Download size={14} /> Export backup
          </Button>
          <Button onClick={() => fileRef.current?.click()}>
            <Upload size={14} /> Import backup
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importBackup(file);
              e.target.value = '';
            }}
          />
          <Button
            variant="danger"
            onClick={() => {
              if (confirm('Reset everything back to the starting data? Your logged work will be lost.')) {
                reset();
                setToast('Reset to seed data');
                setTimeout(() => setToast(null), 1800);
              }
            }}
          >
            <RotateCcw size={14} /> Reset
          </Button>
        </div>
      </Card>

      <Toast message={toast} />
    </div>
  );
}

export default DashboardPage;
