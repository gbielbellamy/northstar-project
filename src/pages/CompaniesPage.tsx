import { useMemo, useState } from 'react';
import { Building2, Check, ExternalLink, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { useStore } from '../store/useStore';
import { todayISO } from '../lib/dates';
import { companyPriorityVariant } from '../lib/ui';
import {
  COMPANY_PRIORITIES,
  COMPANY_STATUSES,
  type Company,
  type CompanyPriority,
  type CompanyStatus,
  type Contact,
} from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Field from '../components/ui/Field';
import EmptyState from '../components/ui/EmptyState';
import Toast from '../components/ui/Toast';
import AnimatedSection from '../components/ui/AnimatedSection';

const BLANK: Omit<Company, 'id'> = {
  name: '',
  sector: '',
  size: '',
  location: '',
  workMode: '',
  priority: 'B',
  fitScore: 70,
  primaryRoles: '',
  secondaryRoles: '',
  whyItFits: '',
  stack: '',
  careersUrl: '',
  linkedinUrl: '',
  nextAction: '',
  status: 'Researching',
  lastReviewed: '',
  notes: '',
};

/** Every company needs a human behind it, so adding one seeds these two targets. */
function contactsFor(company: Company): Omit<Contact, 'id'>[] {
  const base = {
    company: company.name,
    person: '',
    status: 'Not contacted' as const,
    companyUrl: company.linkedinUrl,
    link: '',
    week: null,
    lastContact: '',
    dateSent: '',
    followup: '',
    meeting: '',
    nextAction: '',
    notes: '',
  };
  const search = (title: string) =>
    `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${company.name} ${title}`)}`;

  return [
    {
      ...base,
      targetProfile: 'Technical Support / Solutions Engineer',
      contactType: 'Peer contact',
      searchUrl: search('Technical Support Solutions Engineer'),
      angle: 'Ask about the day-to-day, the hiring bar, and whether the team hires people from non-traditional backgrounds.',
    },
    {
      ...base,
      targetProfile: 'Engineering Manager / Support Manager',
      contactType: 'Hiring influencer',
      searchUrl: search('Engineering Manager Support Manager'),
      angle: 'Share a short portfolio link and ask one specific question about what the team needs.',
    },
  ];
}

function CompaniesPage() {
  const { companies, contacts, settings } = useStore();
  const add = useStore((s) => s.add);
  const update = useStore((s) => s.update);
  const remove = useStore((s) => s.remove);

  const today = todayISO(settings.todayOverride);

  const [q, setQ] = useState('');
  const [priority, setPriority] = useState<CompanyPriority | 'All'>('All');
  const [editing, setEditing] = useState<Company | null>(null);
  const [draft, setDraft] = useState<Omit<Company, 'id'> | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return companies
      .filter((c) => {
        if (priority !== 'All' && c.priority !== priority) return false;
        if (!needle) return true;
        return (
          c.name.toLowerCase().includes(needle) ||
          c.primaryRoles.toLowerCase().includes(needle) ||
          c.stack.toLowerCase().includes(needle) ||
          c.sector.toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => a.priority.localeCompare(b.priority) || b.fitScore - a.fitScore);
  }, [companies, q, priority]);

  const contactCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of contacts) map.set(c.company, (map.get(c.company) ?? 0) + 1);
    return map;
  }, [contacts]);

  function openNew() {
    setEditing(null);
    setDraft({ ...BLANK, lastReviewed: today });
  }
  function openEdit(c: Company) {
    setEditing(c);
    const { id: _id, ...rest } = c;
    void _id;
    setDraft(rest);
  }

  function save() {
    if (!draft) return;
    if (!draft.name.trim()) {
      alert('A company needs a name.');
      return;
    }
    if (editing) {
      update('companies', editing.id, draft);
      setToast(`${draft.name} updated`);
    } else {
      const id = add('companies', draft);
      // Auto-create the two outreach targets, so a new company is never a dead end.
      const seeded = contactsFor({ ...draft, id });
      for (const c of seeded) add('contacts', c);
      setToast(`${draft.name} added — 2 networking targets created`);
    }
    setTimeout(() => setToast(null), 2600);
    setDraft(null);
    setEditing(null);
  }

  function deleteCompany(c: Company) {
    const linked = contacts.filter((x) => x.company === c.name);
    const msg =
      linked.length > 0
        ? `Delete ${c.name} and its ${linked.length} networking contact${linked.length === 1 ? '' : 's'}?`
        : `Delete ${c.name}?`;
    if (!confirm(msg)) return;
    for (const l of linked) remove('contacts', l.id);
    remove('companies', c.id);
  }

  const tierCounts = {
    A: companies.filter((c) => c.priority === 'A').length,
    B: companies.filter((c) => c.priority === 'B').length,
    C: companies.filter((c) => c.priority === 'C').length,
  };

  return (
    <div className="page">
      <div className="page__head">
        <div className="toolbar">
          <div>
            <h1>Companies</h1>
            <p className="page__sub">
              Your target list, ranked by fit rather than by prestige. Tier A is where the weekly applications
              should go; Tier C is a long game you keep warm through networking, not through cold applications.
              Add a company and its two networking targets are created for you.
            </p>
          </div>
          <Button variant="primary" onClick={openNew}>
            <Plus size={14} /> Add company
          </Button>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <Card className="stat">
          <div className="stat__label">Total</div>
          <div className="stat__value">{companies.length}</div>
          <div className="stat__desc">{contacts.length} contacts linked</div>
        </Card>
        <Card className="stat">
          <div className="stat__label">Tier A</div>
          <div className="stat__value" style={{ color: 'var(--ok)' }}>{tierCounts.A}</div>
          <div className="stat__desc">Apply here first</div>
        </Card>
        <Card className="stat">
          <div className="stat__label">Tier B</div>
          <div className="stat__value">{tierCounts.B}</div>
          <div className="stat__desc">Worth the effort, higher bar</div>
        </Card>
        <Card className="stat">
          <div className="stat__label">Tier C</div>
          <div className="stat__value">{tierCounts.C}</div>
          <div className="stat__desc">Network now, apply later</div>
        </Card>
      </div>

      <div className="toolbar">
        <div className="filters">
          <span className="search">
            <Search size={14} />
            <input
              className="input"
              placeholder="Search company, role, stack or sector"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </span>
          <select
            className="select select--inline"
            value={priority}
            onChange={(e) => setPriority(e.target.value as CompanyPriority | 'All')}
          >
            <option value="All">All tiers</option>
            {COMPANY_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                Tier {p}
              </option>
            ))}
          </select>
        </div>
        <span className="muted">{rows.length} shown</span>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<Building2 size={19} />} title="Nothing matches" text="Try another tier, or clear the search." />
      ) : (
        <AnimatedSection>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th className="tight">Tier</th>
                  <th className="tight">Fit</th>
                  <th>Primary roles</th>
                  <th>Why it fits</th>
                  <th className="tight">Contacts</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="cell-strong">
                        {c.careersUrl ? (
                          <a href={c.careersUrl} target="_blank" rel="noreferrer">
                            {c.name} <ExternalLink size={11} />
                          </a>
                        ) : (
                          c.name
                        )}
                      </div>
                      <div className="cell-sub">
                        {c.location} · {c.workMode}
                      </div>
                    </td>
                    <td className="tight">
                      <select
                        className="select select--inline"
                        value={c.priority}
                        onChange={(e) =>
                          update('companies', c.id, { priority: e.target.value as CompanyPriority })
                        }
                        style={{ minWidth: 60 }}
                      >
                        {COMPANY_PRIORITIES.map((p) => (
                          <option key={p}>{p}</option>
                        ))}
                      </select>
                      <div style={{ marginTop: 4 }}>
                        <Badge variant={companyPriorityVariant[c.priority]}>Tier {c.priority}</Badge>
                      </div>
                    </td>
                    <td className="tight">{c.fitScore}</td>
                    <td>
                      <div className="cell-sub">{c.primaryRoles}</div>
                    </td>
                    <td>
                      <div className="cell-sub">{c.whyItFits}</div>
                    </td>
                    <td className="tight">
                      <Badge variant={contactCount.get(c.name) ? 'info' : 'muted'}>
                        <Users size={11} /> {contactCount.get(c.name) ?? 0}
                      </Badge>
                    </td>
                    <td className="tight">
                      <div className="row-actions">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(c)} aria-label="Edit">
                          <Pencil size={13} />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteCompany(c)} aria-label="Delete">
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnimatedSection>
      )}

      <Modal
        open={draft !== null}
        title={editing ? `Edit ${editing.name}` : 'Add company'}
        subtitle={
          editing ? undefined : 'Two networking targets — a peer and a hiring influencer — are created automatically.'
        }
        onClose={() => {
          setDraft(null);
          setEditing(null);
        }}
        actions={
          <>
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
            <Field label="Company name">
              <input
                className="input"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </Field>
            <Field label="Sector">
              <input
                className="input"
                value={draft.sector}
                onChange={(e) => setDraft({ ...draft, sector: e.target.value })}
              />
            </Field>
            <Field label="Size">
              <input
                className="input"
                value={draft.size}
                onChange={(e) => setDraft({ ...draft, size: e.target.value })}
              />
            </Field>
            <Field label="Location">
              <input
                className="input"
                value={draft.location}
                onChange={(e) => setDraft({ ...draft, location: e.target.value })}
              />
            </Field>
            <Field label="Work mode">
              <input
                className="input"
                value={draft.workMode}
                onChange={(e) => setDraft({ ...draft, workMode: e.target.value })}
                placeholder="Hybrid / Remote"
              />
            </Field>
            <Field label="Tier">
              <select
                className="select"
                value={draft.priority}
                onChange={(e) => setDraft({ ...draft, priority: e.target.value as CompanyPriority })}
              >
                {COMPANY_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    Tier {p}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fit score (0–100)" hint="Be honest. A 95 you can't back up just wastes a week.">
              <input
                className="input"
                type="number"
                min={0}
                max={100}
                value={draft.fitScore}
                onChange={(e) => setDraft({ ...draft, fitScore: Number(e.target.value) })}
              />
            </Field>
            <Field label="Status">
              <select
                className="select"
                value={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.value as CompanyStatus })}
              >
                {COMPANY_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Primary target roles" full>
              <input
                className="input"
                value={draft.primaryRoles}
                onChange={(e) => setDraft({ ...draft, primaryRoles: e.target.value })}
              />
            </Field>
            <Field label="Secondary roles" full>
              <input
                className="input"
                value={draft.secondaryRoles}
                onChange={(e) => setDraft({ ...draft, secondaryRoles: e.target.value })}
              />
            </Field>
            <Field label="Relevant stack" full>
              <input
                className="input"
                value={draft.stack}
                onChange={(e) => setDraft({ ...draft, stack: e.target.value })}
              />
            </Field>
            <Field label="Why it fits" full hint="This sentence is what you rewrite into the application's opening line.">
              <textarea
                className="textarea"
                value={draft.whyItFits}
                onChange={(e) => setDraft({ ...draft, whyItFits: e.target.value })}
              />
            </Field>
            <Field label="Careers URL">
              <input
                className="input"
                value={draft.careersUrl}
                onChange={(e) => setDraft({ ...draft, careersUrl: e.target.value })}
              />
            </Field>
            <Field label="LinkedIn URL">
              <input
                className="input"
                value={draft.linkedinUrl}
                onChange={(e) => setDraft({ ...draft, linkedinUrl: e.target.value })}
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

      <Toast message={toast} />
    </div>
  );
}

export default CompaniesPage;
