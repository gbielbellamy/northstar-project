import { useMemo, useState } from 'react';
import { AlarmClock, Check, ExternalLink, Pencil, Plus, Search, Send, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { currentWeekNumber, fmtShort, todayISO } from '../lib/dates';
import { daysSinceApplied, funnel } from '../lib/selectors';
import { applicationVariant } from '../lib/ui';
import {
  APPLICATION_STATUSES,
  ROLE_FAMILIES,
  type Application,
  type ApplicationStatus,
  type RoleFamily,
} from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Field from '../components/ui/Field';
import EmptyState from '../components/ui/EmptyState';
import AnimatedSection from '../components/ui/AnimatedSection';

type SortKey = 'newest' | 'oldest' | 'company' | 'followup';

function blank(week: number, today: string): Omit<Application, 'id'> {
  return {
    company: '',
    role: '',
    family: '',
    status: 'Saved',
    url: '',
    location: '',
    salary: '',
    week,
    dateFound: today,
    deadline: '',
    dateApplied: '',
    followup: '',
    interviewStage: '',
    resumeVersion: '',
    contact: '',
    nextAction: '',
    result: '',
    notes: '',
  };
}

function ApplicationsPage() {
  const { applications, companies, roadmap, settings } = useStore();
  const add = useStore((s) => s.add);
  const update = useStore((s) => s.update);
  const remove = useStore((s) => s.remove);

  const today = todayISO(settings.todayOverride);
  const week = currentWeekNumber(roadmap, today);

  const [filter, setFilter] = useState<ApplicationStatus | 'All'>('All');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [editing, setEditing] = useState<Application | null>(null);
  const [draft, setDraft] = useState<Omit<Application, 'id'> | null>(null);

  const f = useMemo(() => funnel(applications, today), [applications, today]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = applications.filter((a) => {
      if (filter !== 'All' && a.status !== filter) return false;
      if (!needle) return true;
      return (
        a.company.toLowerCase().includes(needle) ||
        a.role.toLowerCase().includes(needle) ||
        a.location.toLowerCase().includes(needle)
      );
    });
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return (a.dateApplied || a.dateFound).localeCompare(b.dateApplied || b.dateFound);
        case 'company':
          return a.company.localeCompare(b.company);
        case 'followup':
          return (a.followup || '9999').localeCompare(b.followup || '9999');
        default:
          return (b.dateApplied || b.dateFound).localeCompare(a.dateApplied || a.dateFound);
      }
    });
    return list;
  }, [applications, filter, q, sort]);

  function openNew() {
    setEditing(null);
    setDraft(blank(week, today));
  }
  function openEdit(a: Application) {
    setEditing(a);
    const { id: _id, ...rest } = a;
    void _id;
    setDraft(rest);
  }
  function save() {
    if (!draft) return;
    if (!draft.company.trim() || !draft.role.trim()) {
      alert('Company and role are the two things you actually need.');
      return;
    }
    // Moving to Applied without a date is the commonest way this log goes stale.
    const patch = { ...draft };
    if (patch.status === 'Applied' && !patch.dateApplied) patch.dateApplied = today;
    if (editing) update('applications', editing.id, patch);
    else add('applications', patch);
    setDraft(null);
    setEditing(null);
  }

  const counts = useMemo(() => {
    const map: Record<string, number> = { All: applications.length };
    for (const s of APPLICATION_STATUSES) map[s] = applications.filter((a) => a.status === s).length;
    return map;
  }, [applications]);

  return (
    <div className="page">
      <div className="page__head">
        <div className="toolbar">
          <div>
            <h1>Applications</h1>
            <p className="page__sub">
              Five tailored applications a week, not fifteen generic ones. Log every one the moment it goes
              out — the response rate below is only honest if this log is.
            </p>
          </div>
          <Button variant="primary" onClick={openNew}>
            <Plus size={14} /> Log application
          </Button>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <Card className="stat">
          <div className="stat__label">Sent</div>
          <div className="stat__value">{f.sent}</div>
          <div className="stat__desc">{f.total} tracked in total</div>
        </Card>
        <Card className="stat">
          <div className="stat__label">Response rate</div>
          <div className="stat__value">{f.responseRate === null ? '—' : `${f.responseRate}%`}</div>
          <div className="stat__desc">
            {f.sent === 0 ? 'Nothing sent yet' : `${f.responded} of ${f.sent} came back`}
          </div>
        </Card>
        <Card className="stat">
          <div className="stat__label">Live</div>
          <div className="stat__value">{f.active}</div>
          <div className="stat__desc">
            {f.interviewing} interviewing · {f.offers} offer{f.offers === 1 ? '' : 's'}
          </div>
        </Card>
        <Card className="stat">
          <div className="stat__label">Follow-ups due</div>
          <div className="stat__value" style={{ color: f.followupsDue > 0 ? 'var(--danger)' : undefined }}>
            {f.followupsDue}
          </div>
          <div className="stat__desc">{f.ghosted} ghosted · {f.rejected} rejected</div>
        </Card>
      </div>

      <div className="toolbar">
        <div className="filters">
          {(['All', ...APPLICATION_STATUSES] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={filter === s ? 'primary' : 'secondary'}
              onClick={() => setFilter(s)}
            >
              {s} {counts[s] ? `(${counts[s]})` : ''}
            </Button>
          ))}
        </div>
      </div>

      <div className="toolbar">
        <div className="filters">
          <span className="search">
            <Search size={14} />
            <input
              className="input"
              placeholder="Search company, role or location"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </span>
          <select className="select select--inline" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="company">Company A–Z</option>
            <option value="followup">Follow-up due</option>
          </select>
        </div>
        <span className="muted">{rows.length} shown</span>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Send size={19} />}
          title={applications.length === 0 ? 'No applications logged yet' : 'Nothing matches that filter'}
          text={
            applications.length === 0
              ? 'Start with a Tier A company from the Companies tab. Tailor the opening line to the product, then log it here.'
              : 'Try a different status or clear the search.'
          }
          action={
            applications.length === 0 ? (
              <Button variant="primary" onClick={openNew}>
                <Plus size={14} /> Log the first one
              </Button>
            ) : undefined
          }
        />
      ) : (
        <AnimatedSection>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Company / role</th>
                  <th className="tight">Status</th>
                  <th className="tight">Applied</th>
                  <th className="tight">Age</th>
                  <th className="tight">Follow-up</th>
                  <th>Next action</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => {
                  const age = daysSinceApplied(a, today);
                  const overdue =
                    a.followup !== '' &&
                    a.followup <= today &&
                    !['Offer', 'Rejected', 'Withdrawn'].includes(a.status);
                  return (
                    <tr key={a.id}>
                      <td>
                        <div className="cell-strong">
                          {a.company}
                          {a.url && (
                            <a
                              href={a.url}
                              target="_blank"
                              rel="noreferrer"
                              style={{ marginLeft: 6, verticalAlign: 'middle' }}
                              aria-label="Open job posting"
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                        <div className="cell-sub">
                          {a.role}
                          {a.family ? ` · ${a.family}` : ''}
                          {a.location ? ` · ${a.location}` : ''}
                        </div>
                      </td>
                      <td className="tight">
                        <select
                          className="select select--inline"
                          value={a.status}
                          onChange={(e) => {
                            const next = e.target.value as ApplicationStatus;
                            const patch: Partial<Application> = { status: next };
                            if (next === 'Applied' && !a.dateApplied) patch.dateApplied = today;
                            update('applications', a.id, patch);
                          }}
                        >
                          {APPLICATION_STATUSES.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                        <div style={{ marginTop: 4 }}>
                          <Badge variant={applicationVariant[a.status]} dot>
                            {a.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="tight">{a.dateApplied ? fmtShort(a.dateApplied) : '—'}</td>
                      <td className="tight">{age === null ? '—' : `${age}d`}</td>
                      <td className="tight">
                        {a.followup ? (
                          overdue ? (
                            <Badge variant="error" dot>
                              <AlarmClock size={11} /> {fmtShort(a.followup)}
                            </Badge>
                          ) : (
                            fmtShort(a.followup)
                          )
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <div className="cell-sub">{a.nextAction || a.notes || '—'}</div>
                      </td>
                      <td className="tight">
                        <div className="row-actions">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(a)} aria-label="Edit">
                            <Pencil size={13} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`Delete the ${a.company} application?`)) remove('applications', a.id);
                            }}
                            aria-label="Delete"
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AnimatedSection>
      )}

      <Modal
        open={draft !== null}
        title={editing ? `${editing.company} — ${editing.role}` : 'Log an application'}
        subtitle="Company and role are required. Everything else you can fill in as it happens."
        onClose={() => {
          setDraft(null);
          setEditing(null);
        }}
        actions={
          <>
            {editing && (
              <span className="spacer">
                <Button
                  variant="danger"
                  onClick={() => {
                    remove('applications', editing.id);
                    setDraft(null);
                    setEditing(null);
                  }}
                >
                  <Trash2 size={14} /> Delete
                </Button>
              </span>
            )}
            <Button
              onClick={() => {
                setDraft(null);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={save}>
              <Check size={14} /> Save
            </Button>
          </>
        }
      >
        {draft && (
          <div className="form-grid">
            <Field label="Company">
              <input
                className="input"
                list="company-list"
                value={draft.company}
                onChange={(e) => setDraft({ ...draft, company: e.target.value })}
              />
              <datalist id="company-list">
                {companies.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </Field>
            <Field label="Role">
              <input
                className="input"
                value={draft.role}
                onChange={(e) => setDraft({ ...draft, role: e.target.value })}
              />
            </Field>
            <Field label="Role family">
              <select
                className="select"
                value={draft.family}
                onChange={(e) => setDraft({ ...draft, family: e.target.value as RoleFamily | '' })}
              >
                <option value="">—</option>
                {ROLE_FAMILIES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                className="select"
                value={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.value as ApplicationStatus })}
              >
                {APPLICATION_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Job URL" full>
              <input
                className="input"
                value={draft.url}
                onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                placeholder="https://"
              />
            </Field>
            <Field label="Location">
              <input
                className="input"
                value={draft.location}
                onChange={(e) => setDraft({ ...draft, location: e.target.value })}
              />
            </Field>
            <Field label="Salary range">
              <input
                className="input"
                value={draft.salary}
                onChange={(e) => setDraft({ ...draft, salary: e.target.value })}
              />
            </Field>
            <Field label="Date applied">
              <input
                className="input"
                type="date"
                value={draft.dateApplied}
                onChange={(e) => setDraft({ ...draft, dateApplied: e.target.value })}
              />
            </Field>
            <Field label="Follow-up date" hint="A week after applying is a fair nudge.">
              <input
                className="input"
                type="date"
                value={draft.followup}
                onChange={(e) => setDraft({ ...draft, followup: e.target.value })}
              />
            </Field>
            <Field label="Resume version" hint="Which tailored version you sent.">
              <input
                className="input"
                value={draft.resumeVersion}
                onChange={(e) => setDraft({ ...draft, resumeVersion: e.target.value })}
              />
            </Field>
            <Field label="Interview stage">
              <input
                className="input"
                value={draft.interviewStage}
                onChange={(e) => setDraft({ ...draft, interviewStage: e.target.value })}
                placeholder="Recruiter screen / technical / onsite"
              />
            </Field>
            <Field label="Contact">
              <input
                className="input"
                value={draft.contact}
                onChange={(e) => setDraft({ ...draft, contact: e.target.value })}
              />
            </Field>
            <Field label="Week">
              <input
                className="input"
                type="number"
                min={1}
                value={draft.week ?? ''}
                onChange={(e) =>
                  setDraft({ ...draft, week: e.target.value === '' ? null : Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Next action" full>
              <input
                className="input"
                value={draft.nextAction}
                onChange={(e) => setDraft({ ...draft, nextAction: e.target.value })}
              />
            </Field>
            <Field label="Notes" full>
              <textarea
                className="textarea"
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ApplicationsPage;
