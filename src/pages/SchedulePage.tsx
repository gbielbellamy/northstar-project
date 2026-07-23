import { useMemo, useState } from 'react';
import { CalendarDays, Check, Coffee, Pencil, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  DAY_KEYS,
  DAY_NAMES,
  addDays,
  currentWeekNumber,
  fmtRange,
  fmtShort,
  hoursBetween,
  todayISO,
} from '../lib/dates';
import { goalsForWeek } from '../lib/selectors';
import { areaClass, statusVariant } from '../lib/ui';
import { AREAS, STATUSES, type Area, type DayKey, type ScheduleBlock, type Status } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Field from '../components/ui/Field';
import Checkbox from '../components/ui/Checkbox';
import AnimatedSection from '../components/ui/AnimatedSection';

const EMPTY: Omit<ScheduleBlock, 'id'> = {
  day: 'Mon',
  start: '09:00',
  end: '10:00',
  area: 'Project',
  label: '',
  optional: false,
};

function SchedulePage() {
  const { roadmap, goals, schedule, dailyLog, settings } = useStore();
  const add = useStore((s) => s.add);
  const update = useStore((s) => s.update);
  const remove = useStore((s) => s.remove);
  const updateGoal = useStore((s) => s.update);
  const toggleLog = useStore((s) => s.toggleLog);

  const today = todayISO(settings.todayOverride);
  const [week, setWeek] = useState(() => currentWeekNumber(roadmap, today));
  const [editing, setEditing] = useState<ScheduleBlock | null>(null);
  const [draft, setDraft] = useState<Omit<ScheduleBlock, 'id'>>(EMPTY);
  const [open, setOpen] = useState(false);

  const rw = roadmap.find((r) => r.week === week);
  const weekGoals = goalsForWeek(goals, week);

  const byDay = useMemo(() => {
    const map = new Map<DayKey, ScheduleBlock[]>();
    for (const key of DAY_KEYS) {
      map.set(
        key,
        schedule.filter((b) => b.day === key).sort((a, b) => a.start.localeCompare(b.start)),
      );
    }
    return map;
  }, [schedule]);

  const weekdayHours = useMemo(
    () =>
      schedule
        .filter((b) => b.area && !b.optional)
        .reduce((sum, b) => sum + hoursBetween(b.start, b.end), 0),
    [schedule],
  );

  if (!rw) return <div className="page">No week selected.</div>;

  const sessions = DAY_KEYS.flatMap((dk, i) =>
    (byDay.get(dk) ?? []).filter((b) => b.area).map((b) => ({ b, date: addDays(rw.start, i) })),
  );
  const doneCount = sessions.filter((s) => dailyLog[s.date]?.[s.b.id]).length;

  function openNew(day: DayKey) {
    setEditing(null);
    setDraft({ ...EMPTY, day });
    setOpen(true);
  }
  function openEdit(b: ScheduleBlock) {
    setEditing(b);
    const { id: _id, ...rest } = b;
    void _id;
    setDraft(rest);
    setOpen(true);
  }
  function save() {
    if (editing) update('schedule', editing.id, draft);
    else add('schedule', draft);
    setOpen(false);
  }

  return (
    <div className="page">
      <div className="page__head">
        <div className="toolbar">
          <div>
            <h1>Schedule</h1>
            <p className="page__sub">
              A fixed working day, 09:00–17:00, with a 30-minute lunch. Same shape every day so you stop
              deciding and start working. Each block shows the week’s real goal for that area — change the goal
              once and every day that touches it updates.
            </p>
          </div>
          <div className="filters">
            <select
              className="select select--inline"
              value={week}
              onChange={(e) => setWeek(Number(e.target.value))}
            >
              {[...roadmap]
                .sort((a, b) => a.week - b.week)
                .map((r) => (
                  <option key={r.id} value={r.week}>
                    Week {r.week} · {fmtRange(r.start, r.end)}
                  </option>
                ))}
            </select>
            <Button onClick={() => setWeek(currentWeekNumber(roadmap, today))}>
              <CalendarDays size={14} /> Today
            </Button>
          </div>
        </div>
      </div>

      <Card className="card--hover">
        <div className="toolbar" style={{ marginBottom: 8 }}>
          <div>
            <div className="card__title" style={{ marginBottom: 2 }}>
              Week {rw.week} — {rw.theme}
            </div>
            <p className="muted">{rw.definitionOfDone}</p>
          </div>
          <div className="row">
            <Badge variant="info">{weekdayHours} h planned</Badge>
            <Badge variant={doneCount === sessions.length ? 'success' : 'muted'}>
              {doneCount}/{sessions.length} sessions logged
            </Badge>
          </div>
        </div>
        <div className="legend" style={{ marginTop: 12 }}>
          {AREAS.map((a) => (
            <span key={a} className={`area-chip ${areaClass(a)}`}>
              <span className="area-dot" />
              {a}
            </span>
          ))}
        </div>
      </Card>

      <div className="stack" style={{ marginTop: 18 }}>
        {DAY_KEYS.map((dk, i) => {
          const date = addDays(rw.start, i);
          const blocks = byDay.get(dk) ?? [];
          const isToday = date === today;
          const isPast = date < today;
          const isWeekend = dk === 'Sat' || dk === 'Sun';
          const beforeStart = date < settings.programStart;

          return (
            <AnimatedSection key={dk} delay={i * 0.03}>
              <div
                className={`day ${isToday ? 'day--today' : ''} ${isPast && !isToday ? 'day--past' : ''} ${
                  isWeekend ? 'day--off' : ''
                }`.trim()}
              >
                <div className="day__head">
                  <span className="day__name">{DAY_NAMES[dk]}</span>
                  <span className="day__date">{fmtShort(date)}</span>
                  {isToday && <Badge variant="neutral">Today</Badge>}
                  {beforeStart && <Badge variant="muted">Before you started</Badge>}
                  {isWeekend && <Badge variant="muted">Optional</Badge>}
                  <div className="day__right">
                    <Button size="sm" variant="ghost" onClick={() => openNew(dk)}>
                      <Plus size={13} /> Block
                    </Button>
                  </div>
                </div>

                {blocks.length === 0 && (
                  <div className="block block--break">
                    <div className="block__time">—</div>
                    <div>Nothing scheduled. A day off is a valid plan.</div>
                  </div>
                )}

                {blocks.map((b) => {
                  if (!b.area) {
                    return (
                      <div key={b.id} className="block block--break">
                        <div className="block__time">
                          {b.start}–{b.end}
                        </div>
                        <div className="row" style={{ gap: 7 }}>
                          <Coffee size={14} /> {b.label}
                        </div>
                      </div>
                    );
                  }
                  const goal = weekGoals.find((g) => g.area === b.area);
                  const done = Boolean(dailyLog[date]?.[b.id]);
                  return (
                    <div
                      key={b.id}
                      className={`block ${areaClass(b.area)} ${done ? 'block--done' : ''}`.trim()}
                    >
                      <div>
                        <div className="block__time">
                          {b.start}–{b.end}
                        </div>
                        <div className="block__dur">{hoursBetween(b.start, b.end)} h</div>
                      </div>

                      <div>
                        <div className="area-chip">
                          <span className="area-dot" />
                          {b.label}
                        </div>
                        <div className="block__title">{goal?.title ?? `No goal set for ${b.area}`}</div>
                        <p className="block__detail">{goal?.detail ?? ''}</p>
                        {goal && <p className="block__dod muted">Done when: {goal.definitionOfDone}</p>}
                      </div>

                      <div className="block__side">
                        {goal && (
                          <select
                            className="select select--inline"
                            value={goal.status}
                            onChange={(e) =>
                              updateGoal('goals', goal.id, { status: e.target.value as Status })
                            }
                            aria-label={`Status for ${b.area}`}
                          >
                            {STATUSES.map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        )}
                        {goal && <Badge variant={statusVariant[goal.status]} dot>{goal.status}</Badge>}
                        <Checkbox
                          checked={done}
                          onChange={(v) => toggleLog(date, b.id, v)}
                          label="Done today"
                        />
                        <div className="row" style={{ gap: 2 }}>
                          <Button size="icon" variant="ghost" onClick={() => openEdit(b)} aria-label="Edit block">
                            <Pencil size={13} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm('Delete this block from every week?')) remove('schedule', b.id);
                            }}
                            aria-label="Delete block"
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </AnimatedSection>
          );
        })}
      </div>

      <Modal
        open={open}
        title={editing ? 'Edit block' : 'Add block'}
        subtitle="Blocks are the weekly template — a change here applies to this weekday in every week."
        onClose={() => setOpen(false)}
        actions={
          <>
            {editing && (
              <span className="spacer">
                <Button
                  variant="danger"
                  onClick={() => {
                    remove('schedule', editing.id);
                    setOpen(false);
                  }}
                >
                  <Trash2 size={14} /> Delete
                </Button>
              </span>
            )}
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={save}>
              <Check size={14} /> Save
            </Button>
          </>
        }
      >
        <div className="form-grid">
          <Field label="Day">
            <select
              className="select"
              value={draft.day}
              onChange={(e) => setDraft({ ...draft, day: e.target.value as DayKey })}
            >
              {DAY_KEYS.map((d) => (
                <option key={d} value={d}>
                  {DAY_NAMES[d]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Area" hint="Leave as Break for lunch or anything not tracked.">
            <select
              className="select"
              value={draft.area ?? ''}
              onChange={(e) => setDraft({ ...draft, area: (e.target.value || null) as Area | null })}
            >
              <option value="">Break / not tracked</option>
              {AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Start">
            <input
              className="input"
              type="time"
              value={draft.start}
              onChange={(e) => setDraft({ ...draft, start: e.target.value })}
            />
          </Field>
          <Field label="End">
            <input
              className="input"
              type="time"
              value={draft.end}
              onChange={(e) => setDraft({ ...draft, end: e.target.value })}
            />
          </Field>
          <Field label="Label" full hint="What you'd call this block on a calendar.">
            <input
              className="input"
              value={draft.label}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              placeholder="Deep work — Career Transition OS"
            />
          </Field>
          <div className="full">
            <Checkbox
              checked={draft.optional}
              onChange={(v) => setDraft({ ...draft, optional: v })}
              label="Optional — doesn’t count toward the weekly hour budget"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default SchedulePage;
