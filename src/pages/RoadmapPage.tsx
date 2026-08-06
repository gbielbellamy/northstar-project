import { useMemo, useState } from 'react';
import { Check, ClipboardCheck, Pencil, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { addDays, fmtRange, todayISO } from '../lib/dates';
import { currentRoadmapWeek, lagFor, roadmapWeekRange } from '../lib/pacing';
import { completionPct, funnel, goalsForWeek, outreachStats } from '../lib/selectors';
import { areaClass, priorityIcon, priorityVariant, statusIcon, statusVariant } from '../lib/ui';
import {
  AREAS,
  PRIORITIES,
  STATUSES,
  type Area,
  type RoadmapWeek,
  type WeeklyGoal,
  type WeeklyReview,
} from '../types';
import Card from '../components/ui/Card';
import WorkingRules from '../components/ui/WorkingRules';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import StatusSelect from '../components/ui/StatusSelect';
import Modal from '../components/ui/Modal';
import Field from '../components/ui/Field';
import Checkbox from '../components/ui/Checkbox';
import ProgressBar from '../components/ui/ProgressBar';
import AnimatedSection from '../components/ui/AnimatedSection';

const BLANK_REVIEW: WeeklyReview = {
  shipped: '',
  evidenceUrls: '',
  applicationsSent: 0,
  messagesSent: 0,
  callsMeetups: 0,
  interviewPrepDone: false,
  technicalLesson: '',
  mainBlocker: '',
  changeNextWeek: '',
  energyFocus: null,
  weekComplete: false,
};

function RoadmapPage() {
  const { roadmap, goals, schedule, deferrals, applications, contacts, reviews, settings } =
    useStore();
  const add = useStore((s) => s.add);
  const update = useStore((s) => s.update);
  const remove = useStore((s) => s.remove);
  const setReview = useStore((s) => s.setReview);

  const today = todayISO(settings.todayOverride);
  const thisWeek = currentRoadmapWeek(schedule, deferrals, settings.programStart, today);
  const projectLag = lagFor(deferrals, 'Project');

  const [openWeek, setOpenWeek] = useState<number | null>(thisWeek);
  const [weekModal, setWeekModal] = useState<RoadmapWeek | null>(null);
  const [weekDraft, setWeekDraft] = useState<Omit<RoadmapWeek, 'id'> | null>(null);
  const [goalModal, setGoalModal] = useState<WeeklyGoal | null>(null);
  const [goalDraft, setGoalDraft] = useState<Omit<WeeklyGoal, 'id'> | null>(null);
  const [reviewWeek, setReviewWeek] = useState<number | null>(null);
  const [reviewDraft, setReviewDraft] = useState<WeeklyReview>(BLANK_REVIEW);

  const sorted = useMemo(() => [...roadmap].sort((a, b) => a.week - b.week), [roadmap]);

  /* ---------- week add/edit ---------- */

  function openAddWeek() {
    const last = sorted[sorted.length - 1];
    const nextNum = last ? last.week + 1 : 1;
    // Dates are computed from the schedule template now (see roadmapWeekRange)
    // — these stored values are only ever used as an initial placeholder.
    const start = last
      ? roadmapWeekRange(schedule, deferrals, settings.programStart, nextNum).start
      : today;
    setWeekModal(null);
    setWeekDraft({
      week: nextNum,
      start,
      end: addDays(start, 6),
      theme: '',
      projectDirection: '',
      definitionOfDone: '',
      status: 'Not started',
      notes: '',
    });
  }

  function openEditWeek(w: RoadmapWeek) {
    setWeekModal(w);
    const { id: _id, ...rest } = w;
    void _id;
    setWeekDraft(rest);
  }

  function saveWeek() {
    if (!weekDraft) return;
    if (weekModal) {
      update('roadmap', weekModal.id, weekDraft);
    } else {
      add('roadmap', weekDraft);
      // A new week with no goals is a heading with nothing under it.
      // Seed one goal per area so the schedule has something to show.
      for (const area of AREAS) {
        add('goals', {
          week: weekDraft.week,
          area,
          title: `${area} — set the goal for week ${weekDraft.week}`,
          detail: '',
          definitionOfDone: '',
          status: 'Not started',
          priority: 'Medium',
          plannedHours: 0,
          evidenceUrl: '',
          notes: '',
        });
      }
      setOpenWeek(weekDraft.week);
    }
    setWeekDraft(null);
    setWeekModal(null);
  }

  function deleteWeek(w: RoadmapWeek) {
    if (!confirm(`Delete week ${w.week} and its ${goalsForWeek(goals, w.week).length} goals?`)) return;
    for (const g of goalsForWeek(goals, w.week)) remove('goals', g.id);
    remove('roadmap', w.id);
  }

  /* ---------- goal add/edit ---------- */

  function openAddGoal(week: number) {
    setGoalModal(null);
    setGoalDraft({
      week,
      area: 'Project',
      title: '',
      detail: '',
      definitionOfDone: '',
      status: 'Not started',
      priority: 'Medium',
      plannedHours: 0,
      evidenceUrl: '',
      notes: '',
    });
  }

  function openEditGoal(g: WeeklyGoal) {
    setGoalModal(g);
    const { id: _id, ...rest } = g;
    void _id;
    setGoalDraft(rest);
  }

  function saveGoal() {
    if (!goalDraft) return;
    if (goalModal) update('goals', goalModal.id, goalDraft);
    else add('goals', goalDraft);
    setGoalDraft(null);
    setGoalModal(null);
  }

  /* ---------- review ---------- */

  function openReview(week: number) {
    const existing = reviews[String(week)];
    if (existing) {
      setReviewDraft(existing);
    } else {
      // Prefill the counts from what you've actually logged this week.
      const range = roadmapWeekRange(schedule, deferrals, settings.programStart, week);
      const inWeek = applications.filter(
        (a) => a.dateApplied >= range.start && a.dateApplied <= range.end,
      );
      const msgs = contacts.filter((c) => c.dateSent >= range.start && c.dateSent <= range.end);
      setReviewDraft({
        ...BLANK_REVIEW,
        applicationsSent: inWeek.length,
        messagesSent: msgs.length,
      });
    }
    setReviewWeek(week);
  }

  function saveReview() {
    if (reviewWeek === null) return;
    setReview(reviewWeek, reviewDraft);
    if (reviewDraft.weekComplete) {
      const w = sorted.find((r) => r.week === reviewWeek);
      if (w) update('roadmap', w.id, { status: 'Done' });
    }
    setReviewWeek(null);
  }

  const f = funnel(applications, today);
  const o = outreachStats(contacts, today);

  return (
    <div className="page">
      <div className="page__head">
        <div className="toolbar">
          <div>
            <h1>Roadmap</h1>
            <p className="page__sub">
              Ten weeks, one project. Each week has a theme and a definition of done — if you can’t tick the
              definition of done, the week isn’t finished, however busy it felt. Everything here is editable,
              and you can add weeks past the tenth when you get there.
            </p>
          </div>
          <Button variant="primary" onClick={openAddWeek}>
            <Plus size={14} /> Add week
          </Button>
        </div>
      </div>

      <WorkingRules />

      {projectLag > 0 && (
        <Card className="lag-banner">
          <p className="muted">
            <strong style={{ color: 'var(--text-h)' }}>
              Project is {projectLag} session{projectLag === 1 ? '' : 's'} behind
            </strong>{' '}
            — every week below has shifted later by the same amount. Catch up in Schedule, or skip
            the block there again if it's not happening.
          </p>
        </Card>
      )}

      <div className="stack" style={{ marginTop: 18 }}>
        {sorted.map((w, i) => {
          const range = roadmapWeekRange(schedule, deferrals, settings.programStart, w.week);
          const pct = completionPct(goals, w.week);
          const wg = goalsForWeek(goals, w.week).sort(
            (a, b) => AREAS.indexOf(a.area) - AREAS.indexOf(b.area),
          );
          const isOpen = openWeek === w.week;
          const isNow = w.week === thisWeek;
          const review = reviews[String(w.week)];

          return (
            <AnimatedSection key={w.id} delay={i * 0.02}>
              <Card className={isNow ? 'card--hover' : ''}>
                <div className="toolbar" style={{ marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div className="row" style={{ gap: 8, marginBottom: 4 }}>
                      <h3>
                        Week {w.week} — {w.theme}
                      </h3>
                      {isNow && <Badge variant="neutral">This week</Badge>}
                      {review?.weekComplete && <Badge variant="success">Reviewed</Badge>}
                    </div>
                    <p className="muted">{fmtRange(range.start, range.end)} · {w.projectDirection}</p>
                  </div>
                  <div className="row">
                    <StatusSelect
                      value={w.status}
                      options={STATUSES}
                      onChange={(v) => update('roadmap', w.id, { status: v })}
                      variant={statusVariant[w.status]}
                      icon={statusIcon[w.status]}
                      ariaLabel={`Status for week ${w.week}`}
                    />
                    <Button size="sm" onClick={() => openReview(w.week)}>
                      <ClipboardCheck size={13} /> Review
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openEditWeek(w)} aria-label="Edit week">
                      <Pencil size={13} />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteWeek(w)} aria-label="Delete week">
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>

                <div className="row" style={{ gap: 10, alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <ProgressBar value={pct} />
                  </div>
                  <span className="muted" style={{ minWidth: 92, textAlign: 'right' }}>
                    {pct}% · {wg.filter((g) => g.status === 'Done').length}/{wg.length} goals
                  </span>
                </div>

                <p className="block__dod muted" style={{ marginBottom: 10 }}>
                  Done when: {w.definitionOfDone}
                </p>
                {w.notes && <p className="muted" style={{ marginBottom: 10 }}>📌 {w.notes}</p>}

                <Button size="sm" variant="ghost" onClick={() => setOpenWeek(isOpen ? null : w.week)}>
                  {isOpen ? 'Hide goals' : `Show ${wg.length} goals`}
                </Button>

                {isOpen && (
                  <div className="table-wrap" style={{ marginTop: 12 }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Area</th>
                          <th>Goal</th>
                          <th className="tight">Hours</th>
                          <th className="tight">Priority</th>
                          <th className="tight">Status</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {wg.map((g) => (
                          <tr key={g.id}>
                            <td className="tight">
                              <span className={`area-chip ${areaClass(g.area)}`}>
                                <span className="area-dot" />
                                {g.area}
                              </span>
                            </td>
                            <td>
                              <div className="cell-strong">{g.title}</div>
                              <div className="cell-sub">{g.detail}</div>
                            </td>
                            <td className="tight">{g.plannedHours} h</td>
                            <td className="tight">
                              <StatusSelect
                                value={g.priority}
                                options={PRIORITIES}
                                onChange={(v) => update('goals', g.id, { priority: v })}
                                variant={priorityVariant[g.priority]}
                                icon={priorityIcon[g.priority]}
                                ariaLabel={`Priority for ${g.title}`}
                              />
                            </td>
                            <td className="tight">
                              <StatusSelect
                                value={g.status}
                                options={STATUSES}
                                onChange={(v) => update('goals', g.id, { status: v })}
                                variant={statusVariant[g.status]}
                                icon={statusIcon[g.status]}
                                ariaLabel={`Status for ${g.title}`}
                              />
                            </td>
                            <td className="tight">
                              <div className="row-actions">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => openEditGoal(g)}
                                  aria-label="Edit goal"
                                >
                                  <Pencil size={13} />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    if (confirm('Delete this goal?')) remove('goals', g.id);
                                  }}
                                  aria-label="Delete goal"
                                >
                                  <Trash2 size={13} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ padding: 10 }}>
                      <Button size="sm" variant="ghost" onClick={() => openAddGoal(w.week)}>
                        <Plus size={13} /> Add goal to week {w.week}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </AnimatedSection>
          );
        })}
      </div>

      {/* ---------- Week modal ---------- */}
      <Modal
        open={weekDraft !== null}
        title={weekModal ? `Edit week ${weekModal.week}` : 'Add a week'}
        subtitle={
          weekModal
            ? undefined
            : 'Adding a week past the tenth is how this plan keeps going — an assistant over your own data is the obvious next one.'
        }
        onClose={() => {
          setWeekDraft(null);
          setWeekModal(null);
        }}
        actions={
          <>
            <Button
              onClick={() => {
                setWeekDraft(null);
                setWeekModal(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={saveWeek}>
              <Check size={14} /> Save
            </Button>
          </>
        }
      >
        {weekDraft && (
          <div className="form-grid">
            <Field label="Week number">
              <input
                className="input"
                type="number"
                min={1}
                value={weekDraft.week}
                onChange={(e) => setWeekDraft({ ...weekDraft, week: Number(e.target.value) })}
              />
            </Field>
            <Field label="Status">
              <StatusSelect
                block
                value={weekDraft.status}
                options={STATUSES}
                onChange={(v) => setWeekDraft({ ...weekDraft, status: v })}
                variant={statusVariant[weekDraft.status]}
                icon={statusIcon[weekDraft.status]}
              />
            </Field>
            <Field label="Theme" full>
              <input
                className="input"
                value={weekDraft.theme}
                onChange={(e) => setWeekDraft({ ...weekDraft, theme: e.target.value })}
                placeholder="An assistant over your own data"
              />
            </Field>
            <Field label="What the project gains" full>
              <textarea
                className="textarea"
                value={weekDraft.projectDirection}
                onChange={(e) => setWeekDraft({ ...weekDraft, projectDirection: e.target.value })}
              />
            </Field>
            <Field label="Definition of done" full hint="Be specific enough that you can't argue with it later.">
              <textarea
                className="textarea"
                value={weekDraft.definitionOfDone}
                onChange={(e) => setWeekDraft({ ...weekDraft, definitionOfDone: e.target.value })}
              />
            </Field>
            <Field label="Notes" full>
              <textarea
                className="textarea"
                value={weekDraft.notes}
                onChange={(e) => setWeekDraft({ ...weekDraft, notes: e.target.value })}
              />
            </Field>
          </div>
        )}
      </Modal>

      {/* ---------- Goal modal ---------- */}
      <Modal
        open={goalDraft !== null}
        title={goalModal ? 'Edit goal' : 'Add goal'}
        onClose={() => {
          setGoalDraft(null);
          setGoalModal(null);
        }}
        actions={
          <>
            <Button
              onClick={() => {
                setGoalDraft(null);
                setGoalModal(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={saveGoal}>
              <Check size={14} /> Save
            </Button>
          </>
        }
      >
        {goalDraft && (
          <div className="form-grid">
            <Field label="Area">
              <select
                className="select"
                value={goalDraft.area}
                onChange={(e) => setGoalDraft({ ...goalDraft, area: e.target.value as Area })}
              >
                {AREAS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </Field>
            <Field label="Week">
              <input
                className="input"
                type="number"
                min={1}
                value={goalDraft.week}
                onChange={(e) => setGoalDraft({ ...goalDraft, week: Number(e.target.value) })}
              />
            </Field>
            <Field label="Priority">
              <StatusSelect
                block
                value={goalDraft.priority}
                options={PRIORITIES}
                onChange={(v) => setGoalDraft({ ...goalDraft, priority: v })}
                variant={priorityVariant[goalDraft.priority]}
                icon={priorityIcon[goalDraft.priority]}
              />
            </Field>
            <Field label="Planned hours">
              <input
                className="input"
                type="number"
                min={0}
                step={0.5}
                value={goalDraft.plannedHours}
                onChange={(e) => setGoalDraft({ ...goalDraft, plannedHours: Number(e.target.value) })}
              />
            </Field>
            <Field label="Title" full>
              <input
                className="input"
                value={goalDraft.title}
                onChange={(e) => setGoalDraft({ ...goalDraft, title: e.target.value })}
              />
            </Field>
            <Field label="What to actually do" full>
              <textarea
                className="textarea"
                value={goalDraft.detail}
                onChange={(e) => setGoalDraft({ ...goalDraft, detail: e.target.value })}
              />
            </Field>
            <Field label="Definition of done" full>
              <textarea
                className="textarea"
                value={goalDraft.definitionOfDone}
                onChange={(e) => setGoalDraft({ ...goalDraft, definitionOfDone: e.target.value })}
              />
            </Field>
            <Field label="Evidence URL" hint="Commit, PR, recording, post.">
              <input
                className="input"
                value={goalDraft.evidenceUrl}
                onChange={(e) => setGoalDraft({ ...goalDraft, evidenceUrl: e.target.value })}
              />
            </Field>
            <Field label="Status">
              <StatusSelect
                block
                value={goalDraft.status}
                options={STATUSES}
                onChange={(v) => setGoalDraft({ ...goalDraft, status: v })}
                variant={statusVariant[goalDraft.status]}
                icon={statusIcon[goalDraft.status]}
              />
            </Field>
          </div>
        )}
      </Modal>

      {/* ---------- Weekly review modal ---------- */}
      <Modal
        open={reviewWeek !== null}
        title={`Week ${reviewWeek} review`}
        subtitle="Thirty minutes on a Friday. The counts are prefilled from what you logged — the lesson and the blocker have to come from you."
        onClose={() => setReviewWeek(null)}
        actions={
          <>
            <Button onClick={() => setReviewWeek(null)}>Cancel</Button>
            <Button variant="primary" onClick={saveReview}>
              <Check size={14} /> Save review
            </Button>
          </>
        }
      >
        <div className="form-grid">
          <Field label="What shipped" full hint="Something a stranger could look at.">
            <textarea
              className="textarea"
              value={reviewDraft.shipped}
              onChange={(e) => setReviewDraft({ ...reviewDraft, shipped: e.target.value })}
            />
          </Field>
          <Field label="Evidence URLs" full>
            <input
              className="input"
              value={reviewDraft.evidenceUrls}
              onChange={(e) => setReviewDraft({ ...reviewDraft, evidenceUrls: e.target.value })}
              placeholder="Commit / PR / deploy / recording"
            />
          </Field>
          <Field label="Applications sent" hint={`Logged this week overall: ${f.sent}`}>
            <input
              className="input"
              type="number"
              min={0}
              value={reviewDraft.applicationsSent}
              onChange={(e) =>
                setReviewDraft({ ...reviewDraft, applicationsSent: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="Messages sent" hint={`Contacts reached overall: ${o.contacted}`}>
            <input
              className="input"
              type="number"
              min={0}
              value={reviewDraft.messagesSent}
              onChange={(e) => setReviewDraft({ ...reviewDraft, messagesSent: Number(e.target.value) })}
            />
          </Field>
          <Field label="Calls / meet-ups">
            <input
              className="input"
              type="number"
              min={0}
              value={reviewDraft.callsMeetups}
              onChange={(e) => setReviewDraft({ ...reviewDraft, callsMeetups: Number(e.target.value) })}
            />
          </Field>
          <Field label="Energy & focus (1–5)">
            <input
              className="input"
              type="number"
              min={1}
              max={5}
              value={reviewDraft.energyFocus ?? ''}
              onChange={(e) =>
                setReviewDraft({
                  ...reviewDraft,
                  energyFocus: e.target.value === '' ? null : Number(e.target.value),
                })
              }
            />
          </Field>
          <Field label="Technical lesson" full hint="One thing you understand now that you didn't on Monday.">
            <textarea
              className="textarea"
              value={reviewDraft.technicalLesson}
              onChange={(e) => setReviewDraft({ ...reviewDraft, technicalLesson: e.target.value })}
            />
          </Field>
          <Field label="Main blocker" full hint="Leaving this blank on a hard week is how the system stops working.">
            <textarea
              className="textarea"
              value={reviewDraft.mainBlocker}
              onChange={(e) => setReviewDraft({ ...reviewDraft, mainBlocker: e.target.value })}
            />
          </Field>
          <Field label="What changes next week" full>
            <textarea
              className="textarea"
              value={reviewDraft.changeNextWeek}
              onChange={(e) => setReviewDraft({ ...reviewDraft, changeNextWeek: e.target.value })}
            />
          </Field>

          <div className="full stack" style={{ gap: 8 }}>
            <Checkbox
              checked={reviewDraft.interviewPrepDone}
              onChange={(v) => setReviewDraft({ ...reviewDraft, interviewPrepDone: v })}
              label="Interview prep completed"
            />
            <Checkbox
              checked={reviewDraft.weekComplete}
              onChange={(v) => setReviewDraft({ ...reviewDraft, weekComplete: v })}
              label="Week complete — marks the roadmap week as Done"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default RoadmapPage;
