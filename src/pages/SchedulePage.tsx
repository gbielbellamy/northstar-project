import { useMemo, useState } from 'react';
import {
  CalendarDays,
  CalendarX,
  Check,
  Circle,
  CircleCheck,
  Coffee,
  Pencil,
  Plus,
  SkipForward,
  Trash2,
  Undo2,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  DAY_KEYS,
  DAY_NAMES,
  addDays,
  dayKeyOf,
  fmtRange,
  fmtShort,
  hoursBetween,
  todayISO,
} from '../lib/dates';
import { contentWeek, currentRoadmapWeek, lagFor, roadmapWeekRange } from '../lib/pacing';
import { areaClass } from '../lib/ui';
import {
  AREAS,
  EXCEPTION_KINDS,
  blockAppliesTo,
  type Area,
  type DayException,
  type DayKey,
  type ExceptionKind,
  type ScheduleBlock,
} from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Field from '../components/ui/Field';
import Checkbox from '../components/ui/Checkbox';
import AnimatedSection from '../components/ui/AnimatedSection';
import NoPlan from '../components/ui/NoPlan';

const EMPTY: Omit<ScheduleBlock, 'id'> = {
  day: 'Mon',
  start: '09:00',
  end: '10:00',
  area: 'Project',
  label: '',
  optional: false,
};

function SchedulePage() {
  const { roadmap, goals, schedule, exceptions, deferrals, dailyLog, settings } = useStore();
  const add = useStore((s) => s.add);
  const update = useStore((s) => s.update);
  const remove = useStore((s) => s.remove);
  const toggleLog = useStore((s) => s.toggleLog);

  const today = todayISO(settings.todayOverride);
  const [week, setWeek] = useState(() =>
    currentRoadmapWeek(schedule, deferrals, settings.programStart, today),
  );
  const [editing, setEditing] = useState<ScheduleBlock | null>(null);
  const [draft, setDraft] = useState<Omit<ScheduleBlock, 'id'>>(EMPTY);
  const [open, setOpen] = useState(false);
  const [exEditing, setExEditing] = useState<DayException | null>(null);
  const [exDraft, setExDraft] = useState<Omit<DayException, 'id'> | null>(null);

  // Falls back to the nearest week rather than showing nothing: the computed
  // week can run past the end of a roadmap that has been shortened.
  const rw =
    roadmap.find((r) => r.week === week) ??
    [...roadmap].sort((a, b) => Math.abs(a.week - week) - Math.abs(b.week - week))[0];
  // Theme and definition of done come from the roadmap entry. Only the dates
  // are computed, since Project's lag stretches the whole plan.
  const weekRange = useMemo(
    () => roadmapWeekRange(schedule, deferrals, settings.programStart, week),
    [schedule, deferrals, settings.programStart, week],
  );

  /** Only the blocks that belong to the week being shown. */
  const weekBlocks = useMemo(
    () => schedule.filter((b) => blockAppliesTo(b, week)),
    [schedule, week],
  );

  const byDay = useMemo(() => {
    const map = new Map<DayKey, ScheduleBlock[]>();
    for (const key of DAY_KEYS) {
      map.set(
        key,
        weekBlocks.filter((b) => b.day === key).sort((a, b) => a.start.localeCompare(b.start)),
      );
    }
    return map;
  }, [weekBlocks]);

  /** Breaks are part of the working day, so the badge counts them in. */
  const { workHours, breakHours } = useMemo(() => {
    let work = 0;
    let brk = 0;
    for (const b of weekBlocks) {
      if (b.optional) continue;
      const h = hoursBetween(b.start, b.end);
      if (b.area) work += h;
      else brk += h;
    }
    return { workHours: work, breakHours: brk };
  }, [schedule]);

  // An account created without a plan has no weeks to show.
  if (roadmap.length === 0) return <NoPlan what="timetable" />;

  /** Hours displaced this week and not yet made up. */
  const hoursOwed = exceptions
    .filter((e) => !e.recovered && e.date >= weekRange.start && e.date <= weekRange.end)
    .reduce((sum, e) => sum + e.hoursOwed, 0);

  const sessions = DAY_KEYS.flatMap((dk, i) =>
    (byDay.get(dk) ?? [])
      .filter((b) => b.area)
      .map((b) => ({ b, date: addDays(weekRange.start, i) })),
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

  /** Planned work on a given weekday — the default number of hours owed. */
  function dayWorkHours(day: DayKey): number {
    return (byDay.get(day) ?? [])
      .filter((b) => b.area && !b.optional)
      .reduce((sum, b) => sum + hoursBetween(b.start, b.end), 0);
  }

  function openException(date: string, defaultHours: number) {
    const found = exceptions.find((e) => e.date === date) ?? null;
    setExEditing(found);
    if (found) {
      const { id: _id, ...rest } = found;
      void _id;
      setExDraft(rest);
    } else {
      setExDraft({
        date,
        kind: 'Networking event',
        note: '',
        hoursOwed: defaultHours,
        recoverOn: '',
        recovered: false,
      });
    }
  }

  function saveException() {
    if (!exDraft) return;
    if (exEditing) {
      update('exceptions', exEditing.id, exDraft);
    } else {
      add('exceptions', exDraft);
      // Cancelling a day defers every area block on it at once. Only on
      // create: re-saving must not re-defer blocks already done or skipped.
      const dayBlocks = byDay.get(dayKeyOf(exDraft.date)) ?? [];
      for (const b of dayBlocks) {
        if (!b.area) continue;
        if (dailyLog[exDraft.date]?.[b.id]) continue;
        if (deferrals.some((d) => d.date === exDraft.date && d.blockId === b.id)) continue;
        add('deferrals', { date: exDraft.date, blockId: b.id, area: b.area });
      }
    }
    setExDraft(null);
    setExEditing(null);
  }

  return (
    <div className="page">
      <div className="page__head">
        <div className="toolbar">
          <div>
            <h1>Schedule</h1>
            <p className="page__sub">
              Your working week, block by block. Each block says what finishing that one sitting looks
              like; the week's target lives in Roadmap. Skip a session and its content moves to that
              area's next slot instead of being lost.
            </p>
          </div>
        </div>
      </div>

      {/* Pinned, because the page is seven days long. */}
      <button
        type="button"
        className="page-action"
        onClick={() => setWeek(currentRoadmapWeek(schedule, deferrals, settings.programStart, today))}
        title="Jump to the current week"
      >
        <CalendarDays size={15} /> Today
      </button>

      <Card>
        {/* The week picker belongs with the week it changes. */}
        <div className="toolbar" style={{ marginBottom: 10 }}>
          <div className="filters">
            <select
              className="select select--inline"
              value={week}
              onChange={(e) => setWeek(Number(e.target.value))}
              aria-label="Week"
            >
              {[...roadmap]
                .sort((a, b) => a.week - b.week)
                .map((r) => {
                  // Each option needs its own range: later weeks shift further
                  // out as the plan slips.
                  const range = roadmapWeekRange(schedule, deferrals, settings.programStart, r.week);
                  return (
                    <option key={r.id} value={r.week}>
                      Week {r.week} · {fmtRange(range.start, range.end)}
                    </option>
                  );
                })}
            </select>
          </div>
        </div>

        <div className="toolbar" style={{ marginBottom: 8 }}>
          <div>
            <div className="card__title" style={{ marginBottom: 2 }}>
              Week {rw.week} — {rw.theme}
            </div>
            <p className="muted">{rw.definitionOfDone}</p>
          </div>
          <div className="row">
            <Badge variant="info">{workHours}h planned</Badge>
            {hoursOwed > 0 && (
              <Badge variant="warning" dot>
                <CalendarX size={11} /> {hoursOwed}h to make up
              </Badge>
            )}
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
          <span className="area-chip area-chip--break" title={`${breakHours}h a week`}>
            <span className="area-dot" />
            Breaks
          </span>
        </div>
      </Card>

      <div className="stack" style={{ marginTop: 18 }}>
        {DAY_KEYS.map((dk, i) => {
          const date = addDays(weekRange.start, i);
          const blocks = byDay.get(dk) ?? [];
          const isToday = date === today;
          const isPast = date < today;
          const isWeekend = dk === 'Sat' || dk === 'Sun';
          const beforeStart = date < settings.programStart;
          const ex = exceptions.find((e) => e.date === date);
          const recovering = exceptions.filter((e) => e.recoverOn === date && !e.recovered);

          return (
            <AnimatedSection key={dk} delay={i * 0.03}>
              <div
                className={`day ${isToday ? 'day--today' : ''} ${isPast && !isToday ? 'day--past' : ''} ${
                  isWeekend ? 'day--off' : ''
                } ${ex ? 'day--displaced' : ''}`.trim()}
              >
                <div className="day__head">
                  <span className="day__name">{DAY_NAMES[dk]}</span>
                  <span className="day__date">{fmtShort(date)}</span>
                  {isToday && <Badge variant="neutral">Today</Badge>}
                  {beforeStart && <Badge variant="muted">Before you started</Badge>}
                  {isWeekend && !ex && recovering.length === 0 && (
                    <Badge variant="muted">Optional</Badge>
                  )}
                  {ex && (
                    <Badge variant="warning" dot>
                      <CalendarX size={11} /> {ex.kind}
                    </Badge>
                  )}
                  {recovering.length > 0 && (
                    <Badge variant="info" dot>
                      <Undo2 size={11} /> Making up{' '}
                      {recovering.reduce((n, e) => n + e.hoursOwed, 0)}h
                    </Badge>
                  )}
                  <div className="day__right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openException(date, dayWorkHours(dk))}
                    >
                      <CalendarX size={13} /> {ex ? 'Edit event' : 'Event'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openNew(dk)}>
                      <Plus size={13} /> Block
                    </Button>
                  </div>
                </div>

                {ex && (
                  <div className="displaced-note">
                    <strong>{ex.kind}</strong>
                    {ex.note ? ` — ${ex.note}` : ''}.{' '}
                    {ex.recovered ? (
                      <>Those {ex.hoursOwed}h have been made up.</>
                    ) : ex.recoverOn ? (
                      <>
                        {ex.hoursOwed}h owed, booked for {fmtShort(ex.recoverOn)}.
                      </>
                    ) : (
                      <>
                        {ex.hoursOwed}h owed — pick a day to make them up, at the weekend or as extra
                        time midweek.
                      </>
                    )}
                  </div>
                )}

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
                  // Which week's goal is due here. Behind the selected week if
                  // this area has unrecovered skips.
                  const activeWeek = contentWeek(
                    schedule,
                    deferrals,
                    settings.programStart,
                    b.area,
                    date,
                  );
                  const goal = goals.find((g) => g.area === b.area && g.week === activeWeek);
                  const lag = lagFor(deferrals, b.area);
                  const catchingUp = activeWeek < week;
                  const done = Boolean(dailyLog[date]?.[b.id]);
                  const deferral = deferrals.find((d) => d.date === date && d.blockId === b.id);
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
                        {/* This sitting's task only. The week's goal is in Roadmap. */}
                        <div className="block__title">
                          {b.sessionDone ?? goal?.title ?? `No goal set for ${b.area}`}
                        </div>
                        {b.steps && b.steps.length > 0 && (
                          <ol className="block__steps">
                            {b.steps.map((step) => (
                              <li key={step}>{step}</li>
                            ))}
                          </ol>
                        )}
                        {catchingUp && (
                          <p className="block__dod" style={{ color: 'var(--warn)' }}>
                            Catching up: Week {activeWeek}’s goal — {lag} session{lag === 1 ? '' : 's'}{' '}
                            behind on {b.area}.
                          </p>
                        )}
                      </div>

                      <div className="block__side">
                        {deferral ? (
                          <div className="skip-note">
                            <span className="status-chip status-chip--warning">
                              <SkipForward size={13} /> Skipped
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => remove('deferrals', deferral.id)}
                            >
                              <Undo2 size={13} /> Undo
                            </Button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              className={`day-toggle ${done ? 'day-toggle--on' : ''}`.trim()}
                              onClick={() => toggleLog(date, b.id, !done)}
                              aria-pressed={done}
                              aria-label={`Mark ${b.label} done on ${fmtShort(date)}`}
                            >
                              {done ? <CircleCheck size={14} /> : <Circle size={14} />}
                              {done ? 'Done' : 'Mark done'}
                            </button>
                            {!done && (
                              <button
                                type="button"
                                className="day-toggle"
                                onClick={() =>
                                  add('deferrals', { date, blockId: b.id, area: b.area! })
                                }
                                title={`Push this to the next ${b.area} session`}
                                aria-label={`Skip ${b.label} on ${fmtShort(date)} — push to the next ${b.area} session`}
                              >
                                <SkipForward size={14} /> Skip
                              </button>
                            )}
                          </>
                        )}
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
              placeholder="Deep work — Northstar"
            />
          </Field>
          <Field
            label="Done when"
            full
            hint="What finishing this one sitting looks like. The week's target lives in Roadmap."
          >
            <textarea
              className="textarea"
              value={draft.sessionDone ?? ''}
              onChange={(e) => setDraft({ ...draft, sessionDone: e.target.value })}
              placeholder="Three applications out, chosen from both tracks."
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

      {/* ---------- Day that didn't go to plan ---------- */}
      <Modal
        open={exDraft !== null}
        title={exEditing ? 'Edit event day' : 'Mark an event day'}
        subtitle="The hours don't vanish — say when they come back and the week still adds up."
        onClose={() => {
          setExDraft(null);
          setExEditing(null);
        }}
        actions={
          <>
            {exEditing && (
              <span className="spacer">
                <Button
                  variant="danger"
                  onClick={() => {
                    remove('exceptions', exEditing.id);
                    setExDraft(null);
                    setExEditing(null);
                  }}
                >
                  <Trash2 size={14} /> Remove
                </Button>
              </span>
            )}
            <Button
              onClick={() => {
                setExDraft(null);
                setExEditing(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={saveException}>
              <Check size={14} /> Save
            </Button>
          </>
        }
      >
        {exDraft && (
          <div className="form-grid">
            <Field label="Date">
              <input
                className="input"
                type="date"
                value={exDraft.date}
                onChange={(e) => setExDraft({ ...exDraft, date: e.target.value })}
              />
            </Field>
            <Field label="What came up">
              <select
                className="select"
                value={exDraft.kind}
                onChange={(e) =>
                  setExDraft({ ...exDraft, kind: e.target.value as ExceptionKind })
                }
              >
                {EXCEPTION_KINDS.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </Field>
            <Field
              label="Hours owed"
              hint="Defaults to the whole day. Drop it if you only lost the afternoon."
            >
              <input
                className="input"
                type="number"
                min={0}
                step={0.25}
                value={exDraft.hoursOwed}
                onChange={(e) => setExDraft({ ...exDraft, hoursOwed: Number(e.target.value) })}
              />
            </Field>
            <Field label="Make them up on" hint="A weekend day, or extra time midweek.">
              <input
                className="input"
                type="date"
                value={exDraft.recoverOn}
                onChange={(e) => setExDraft({ ...exDraft, recoverOn: e.target.value })}
              />
            </Field>
            <Field
              label="Notes"
              full
              hint="What happened — the event and who you met, or the bug and where it stalled you."
            >
              <textarea
                className="textarea"
                value={exDraft.note}
                onChange={(e) => setExDraft({ ...exDraft, note: e.target.value })}
                placeholder="React meetup, San Jose — two people from the Postman team going. Or: migration wouldn't run against the seeded data, lost the afternoon to it."
              />
            </Field>
            <div className="full">
              <Checkbox
                checked={exDraft.recovered}
                onChange={(v) => setExDraft({ ...exDraft, recovered: v })}
                label="Already made up — stop counting these hours as owed"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default SchedulePage;
