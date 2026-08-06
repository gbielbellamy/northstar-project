import { useMemo, useState } from 'react';
import {
  Building2,
  Check,
  Circle,
  CircleDot,
  ExternalLink,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Users,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { todayISO } from '../lib/dates';
import { BLANK_COMPANY, contactsFor } from '../lib/companies';
import {
  companyPriorityIcon,
  companyPriorityVariant,
  companyStatusIcon,
  companyStatusVariant,
} from '../lib/ui';
import {
  COMPANY_PRIORITIES,
  COMPANY_STATUSES,
  type Company,
  type CompanyPriority,
} from '../types';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import StatCard from '../components/ui/StatCard';
import StatusSelect from '../components/ui/StatusSelect';
import Modal from '../components/ui/Modal';
import Field from '../components/ui/Field';
import EmptyState from '../components/ui/EmptyState';
import Toast from '../components/ui/Toast';
import AnimatedSection from '../components/ui/AnimatedSection';

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
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [companies, q, priority]);

  const contactCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of contacts) map.set(c.company, (map.get(c.company) ?? 0) + 1);
    return map;
  }, [contacts]);

  function openNew() {
    setEditing(null);
    setDraft({ ...BLANK_COMPANY, lastReviewed: today });
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
      add('companies', draft);
      // Auto-create the two outreach targets, so a new company is never a dead end.
      for (const c of contactsFor(draft)) add('contacts', c);
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
              The target list, ranked by fit rather than prestige. Adding a company creates its outreach
              targets automatically.
            </p>
          </div>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <StatCard
          label="Total"
          value={companies.length}
          desc={`${contacts.length} contacts linked`}
          icon={<Building2 size={16} />}
          color="var(--area-learning)"
        />
        <StatCard
          label="Tier A"
          value={tierCounts.A}
          desc="Apply here first"
          icon={<Star size={16} />}
          color="var(--ok)"
          index={1}
        />
        <StatCard
          label="Tier B"
          value={tierCounts.B}
          desc="Worth the effort, higher bar"
          icon={<CircleDot size={16} />}
          color="var(--warn)"
          index={2}
        />
        <StatCard
          label="Tier C"
          value={tierCounts.C}
          desc="Network now, apply later"
          icon={<Circle size={16} />}
          color="var(--muted-dot)"
          index={3}
        />
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
        <div className="row" style={{ gap: 12 }}>
          <span className="muted">{rows.length} shown</span>
          <Button variant="primary" onClick={openNew}>
            <Plus size={14} /> Add company
          </Button>
        </div>
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
                      <StatusSelect
                        value={c.priority}
                        options={COMPANY_PRIORITIES}
                        onChange={(v) => update('companies', c.id, { priority: v })}
                        variant={companyPriorityVariant[c.priority]}
                        icon={companyPriorityIcon[c.priority]}
                        renderLabel={(p) => `Tier ${p}`}
                        ariaLabel={`Tier for ${c.name}`}
                      />
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
              <StatusSelect
                block
                value={draft.priority}
                options={COMPANY_PRIORITIES}
                onChange={(v) => setDraft({ ...draft, priority: v })}
                variant={companyPriorityVariant[draft.priority]}
                icon={companyPriorityIcon[draft.priority]}
                renderLabel={(p) => `Tier ${p}`}
              />
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
              <StatusSelect
                block
                value={draft.status}
                options={COMPANY_STATUSES}
                onChange={(v) => setDraft({ ...draft, status: v })}
                variant={companyStatusVariant[draft.status]}
                icon={companyStatusIcon[draft.status]}
              />
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
