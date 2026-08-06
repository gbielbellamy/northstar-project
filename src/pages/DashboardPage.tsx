import { useMemo, useRef, useState } from 'react';
import {
  AlarmClock,
  ArrowRight,
  Building2,
  CalendarCheck,
  Circle,
  CircleCheck,
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
import { dayKeyOf, fmtLong, fmtRange, hoursBetween, todayISO } from '../lib/dates';
import { currentRoadmapWeek, roadmapWeekRange } from '../lib/pacing';
import { areaClass } from '../lib/ui';
import { blockAppliesTo, type AppState, type Area } from '../types';
import type { PageKey } from '../App';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Field from '../components/ui/Field';
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
  Algorithms: 'var(--area-algorithms)',
  Contributions: 'var(--area-opensource)',
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
  const { roadmap, goals, schedule, deferrals, applications, contacts, companies, dailyLog, settings } =
    state;
  const replaceAll = useStore((s) => s.replaceAll);
  const reset = useStore((s) => s.reset);
  const toggleLog = useStore((s) => s.toggleLog);
  const setSettings = useStore((s) => s.setSettings);

  const [toast, setToast] = useState<string | null>(null);
  const [targetsOpen, setTargetsOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const today = todayISO(settings.todayOverride);
  const week = currentRoadmapWeek(schedule, deferrals, settings.programStart, today);
  const rw = roadmap.find((r) => r.week === week);
  const weekRange = roadmapWeekRange(schedule, deferrals, settings.programStart, week);

  const f = useMemo(() => funnel(applications, today), [applications, today]);
  const o = useMemo(() => outreachStats(contacts, today), [contacts, today]);
  const weekPct = completionPct(goals, week);

  /**
   * The timetable changes partway through the programme — open source takes
   * over a slot in week 5 — so only count the blocks that apply to the week
   * being shown. Summing every block double-counts the swapped slot.
   */
  const weekBlocks = useMemo(
    () => schedule.filter((b) => blockAppliesTo(b, week)),
    [schedule, week],
  );

  const todayBlocks = useMemo(() => {
    const dk = dayKeyOf(today);
    return weekBlocks
      .filter((b) => b.day === dk && b.area !== null)
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [weekBlocks, today]);

  const todayDone = todayBlocks.filter((b) => dailyLog[today]?.[b.id]).length;
  /** Week 1 hasn't begun yet — don't nag about blocks that aren't due. */
  const beforeStart = today < settings.programStart;

  /** Work by area, plus the breaks — they're part of the working day too. */
  const hourSlices: HourSlice[] = useMemo(() => {
    const byArea = new Map<Area, number>();
    let breaks = 0;
    for (const b of weekBlocks) {
      if (b.optional) continue;
      const h = hoursBetween(b.start, b.end);
      if (b.area) byArea.set(b.area, (byArea.get(b.area) ?? 0) + h);
      else breaks += h;
    }
    const slices: HourSlice[] = [...byArea.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([area, value]) => ({ name: area, value: Math.round(value * 10) / 10, color: AREA_COLOR[area] }));
    if (breaks > 0) {
      slices.push({ name: 'Breaks', value: Math.round(breaks * 10) / 10, color: 'var(--muted-dot)' });
    }
    return slices;
  }, [weekBlocks]);

  const workHours = useMemo(
    () =>
      weekBlocks
        .filter((b) => b.area && !b.optional)
        .reduce((sum, b) => sum + hoursBetween(b.start, b.end), 0),
    [weekBlocks],
  );

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

  /** What you've actually done inside the current roadmap week. */
  const thisWeek = useMemo(() => {
    const inRange = (d: string) => Boolean(rw) && d >= rw!.start && d <= rw!.end;
    return {
      applications: applications.filter((a) => inRange(a.dateApplied)).length,
      contacts: contacts.filter((c) => inRange(c.dateSent)).length,
    };
  }, [applications, contacts, rw]);

  const t = settings.targets;
  const applicationTarget = t.directApplicationsPerWeek + t.bridgeApplicationsPerWeek;
  const pct = (done: number, target: number) => (target > 0 ? (done / target) * 100 : 0);

  function exportBackup() {
    const payload: AppState = {
      roadmap: state.roadmap,
      goals: state.goals,
      schedule: state.schedule,
      exceptions: state.exceptions,
      deferrals: state.deferrals,
      oss: state.oss,
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
              Week {week} of {roadmap.length} · {rw ? fmtRange(weekRange.start, weekRange.end) : ''}
            </div>
            <h1 className="hero__title">
              {greeting()}. {rw?.theme ?? 'Let’s go'}.
            </h1>
            <p className="hero__meta">
              {beforeStart ? (
                <>
                  {fmtLong(today)} — the programme starts {fmtLong(settings.programStart)}. Nothing to log
                  yet: use the time to read week 1 and line up the first five companies.
                </>
              ) : (
                <>
                  {fmtLong(today)} — {todayBlocks.length} blocks planned, {todayDone} done.{' '}
                  {todayDone === todayBlocks.length && todayBlocks.length > 0
                    ? 'That’s the day closed out. Well done.'
                    : 'Open the schedule and take the next one.'}
                </>
              )}
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
        <span className="muted">
          The coloured cards are graded against your own targets — hover one to change it.
        </span>
      </div>
      <div className="stat-grid">
        <StatCard
          index={0}
          label="Applications this week"
          value={thisWeek.applications}
          desc={`${f.total} tracked in total`}
          icon={<Send size={16} />}
          progress={pct(thisWeek.applications, applicationTarget)}
          targetLabel={`${thisWeek.applications} / ${applicationTarget} this week`}
          onEditTarget={() => setTargetsOpen(true)}
        />
        <StatCard
          index={1}
          label="Response rate"
          value={f.responseRate === null ? '—' : `${f.responseRate}%`}
          desc={f.sent === 0 ? 'Send the first one' : `${f.responded} of ${f.sent} came back`}
          icon={<TrendingUp size={16} />}
          progress={pct(f.responseRate ?? 0, t.responseRate)}
          targetLabel={`Target ${t.responseRate}%`}
          onEditTarget={() => setTargetsOpen(true)}
        />
        <StatCard
          index={2}
          label="Live conversations"
          value={f.active}
          desc={`${f.interviewing} interviewing · ${f.offers} offer${f.offers === 1 ? '' : 's'}`}
          icon={<Target size={16} />}
          progress={pct(f.active, t.liveConversations)}
          targetLabel={`${f.active} / ${t.liveConversations} at once`}
          onEditTarget={() => setTargetsOpen(true)}
        />
        <StatCard
          index={3}
          label="Follow-ups due"
          value={f.followupsDue + o.followupsDue}
          desc="Applications and contacts combined"
          icon={<AlarmClock size={16} />}
          progress={Math.min(100, (f.followupsDue + o.followupsDue) * 20)}
          targetLabel="Keep this at zero"
          invert
        />
        <StatCard
          index={4}
          label="People contacted this week"
          value={thisWeek.contacts}
          desc={`${o.totalTargets} targets loaded`}
          icon={<MessageSquare size={16} />}
          progress={pct(thisWeek.contacts, t.contactsPerWeek)}
          targetLabel={`${thisWeek.contacts} / ${t.contactsPerWeek} this week`}
          onEditTarget={() => setTargetsOpen(true)}
        />
        <StatCard
          index={5}
          label="Replies"
          value={o.replied}
          desc={`${o.meetings} meeting${o.meetings === 1 ? '' : 's'} scheduled`}
          icon={<CalendarCheck size={16} />}
          color="var(--area-review)"
        />
        <StatCard
          index={6}
          label="Tier A companies"
          value={tierA}
          desc={`${companies.length} in the list`}
          icon={<Building2 size={16} />}
          color="var(--area-learning)"
        />
        <StatCard
          index={7}
          label="Programme progress"
          value={`${completionPct(goals)}%`}
          desc={`${goals.filter((g) => g.status === 'Done').length} of ${goals.length} goals`}
          icon={<Target size={16} />}
          progress={completionPct(goals)}
          targetLabel="All ten weeks"
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
          <Card title={`Where the week goes (${workHours}h + breaks)`}>
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
                  <div className="block__side">
                    <button
                      type="button"
                      className={`day-toggle ${done ? 'day-toggle--on' : ''}`.trim()}
                      onClick={() => toggleLog(today, b.id, !done)}
                      aria-pressed={done}
                      aria-label={`Mark ${b.label} done today`}
                    >
                      {done ? <CircleCheck size={14} /> : <Circle size={14} />}
                      {done ? 'Done' : 'Mark done'}
                    </button>
                  </div>
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

      <Modal
        open={targetsOpen}
        title="Your weekly targets"
        subtitle="The numbers the cards are measured against."
        onClose={() => setTargetsOpen(false)}
        actions={<Button variant="primary" onClick={() => setTargetsOpen(false)}>Done</Button>}
      >
        <div className="form-grid">
          <Field label="Direct applications / week" hint="Software Engineer, Full-Stack Engineer.">
            <input
              className="input"
              type="number"
              min={0}
              value={t.directApplicationsPerWeek}
              onChange={(e) =>
                setSettings({
                  targets: { ...t, directApplicationsPerWeek: Number(e.target.value) },
                })
              }
            />
          </Field>
          <Field label="Bridge applications / week" hint="Support, solutions, implementation, QA.">
            <input
              className="input"
              type="number"
              min={0}
              value={t.bridgeApplicationsPerWeek}
              onChange={(e) =>
                setSettings({
                  targets: { ...t, bridgeApplicationsPerWeek: Number(e.target.value) },
                })
              }
            />
          </Field>
          <Field label="Contacts / week">
            <input
              className="input"
              type="number"
              min={0}
              value={t.contactsPerWeek}
              onChange={(e) =>
                setSettings({ targets: { ...t, contactsPerWeek: Number(e.target.value) } })
              }
            />
          </Field>
          <Field label="Response rate target (%)" hint="Under 10% means targeting or CV, not volume.">
            <input
              className="input"
              type="number"
              min={0}
              max={100}
              value={t.responseRate}
              onChange={(e) =>
                setSettings({ targets: { ...t, responseRate: Number(e.target.value) } })
              }
            />
          </Field>
          <Field label="Live conversations" hint="Interviews and offers running at once.">
            <input
              className="input"
              type="number"
              min={0}
              value={t.liveConversations}
              onChange={(e) =>
                setSettings({ targets: { ...t, liveConversations: Number(e.target.value) } })
              }
            />
          </Field>
          <Field label="Weekly hours" hint={`The schedule currently plans ${workHours}h of work.`}>
            <input
              className="input"
              type="number"
              min={0}
              value={t.weeklyHours}
              onChange={(e) =>
                setSettings({ targets: { ...t, weeklyHours: Number(e.target.value) } })
              }
            />
          </Field>
        </div>
      </Modal>

      <Toast message={toast} />
    </div>
  );
}

export default DashboardPage;
