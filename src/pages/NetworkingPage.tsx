import { useMemo, useState } from 'react';
import {
  AlarmClock,
  Check,
  ExternalLink,
  MessageCircleReply,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  Users,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { currentWeekNumber, fmtShort, todayISO } from '../lib/dates';
import { outreachStats } from '../lib/selectors';
import { contactIcon, contactVariant } from '../lib/ui';
import {
  CONTACT_STATUSES,
  CONTACT_TYPES,
  type Contact,
  type ContactStatus,
  type ContactType,
} from '../types';
import Button from '../components/ui/Button';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import StatusSelect from '../components/ui/StatusSelect';
import Modal from '../components/ui/Modal';
import Field from '../components/ui/Field';
import EmptyState from '../components/ui/EmptyState';
import AnimatedSection from '../components/ui/AnimatedSection';

function NetworkingPage() {
  const { contacts, companies, roadmap, settings } = useStore();
  const add = useStore((s) => s.add);
  const update = useStore((s) => s.update);
  const remove = useStore((s) => s.remove);

  const today = todayISO(settings.todayOverride);
  const week = currentWeekNumber(roadmap, today);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState<ContactStatus | 'All'>('All');
  const [editing, setEditing] = useState<Contact | null>(null);
  const [draft, setDraft] = useState<Omit<Contact, 'id'> | null>(null);

  const o = useMemo(() => outreachStats(contacts, today), [contacts, today]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return contacts
      .filter((c) => {
        if (status !== 'All' && c.status !== status) return false;
        if (!needle) return true;
        return (
          c.company.toLowerCase().includes(needle) ||
          c.person.toLowerCase().includes(needle) ||
          c.targetProfile.toLowerCase().includes(needle)
        );
      })
      // Two rows per company, so break the tie on the target profile to keep
      // a company's contacts adjacent and in a stable order.
      .sort((a, b) => a.company.localeCompare(b.company) || a.targetProfile.localeCompare(b.targetProfile));
  }, [contacts, q, status]);

  function openNew() {
    setEditing(null);
    setDraft({
      company: '',
      person: '',
      targetProfile: '',
      contactType: 'Peer contact',
      status: 'Not contacted',
      searchUrl: '',
      companyUrl: '',
      link: '',
      angle: '',
      week,
      lastContact: '',
      dateSent: '',
      followup: '',
      meeting: '',
      nextAction: '',
      notes: '',
    });
  }
  function openEdit(c: Contact) {
    setEditing(c);
    const { id: _id, ...rest } = c;
    void _id;
    setDraft(rest);
  }
  function save() {
    if (!draft) return;
    if (!draft.company.trim()) {
      alert('A company is the minimum — the person can come later.');
      return;
    }
    const patch = { ...draft };
    if (patch.status === 'Sent' && !patch.dateSent) patch.dateSent = today;
    if (editing) update('contacts', editing.id, patch);
    else add('contacts', patch);
    setDraft(null);
    setEditing(null);
  }

  return (
    <div className="page">
      <div className="page__head">
        <div className="toolbar">
          <div>
            <h1>Networking</h1>
            <p className="page__sub">
              Outreach targets and their status, one row per person.
            </p>
          </div>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <StatCard
          label="Targets"
          value={o.totalTargets}
          desc={`Across ${companies.length} companies`}
          icon={<Users size={16} />}
          color="var(--area-networking)"
        />
        <StatCard
          label="Contacted"
          value={o.contacted}
          desc="Target: 6 a week"
          icon={<Send size={16} />}
          color="var(--info)"
          index={1}
        />
        <StatCard
          label="Replies"
          value={o.replied}
          desc={`${o.meetings} meeting${o.meetings === 1 ? '' : 's'} scheduled`}
          icon={<MessageCircleReply size={16} />}
          color="var(--ok)"
          index={2}
        />
        <StatCard
          label="Follow-ups due"
          value={o.followupsDue}
          desc="One nudge is fair; two is noise"
          icon={<AlarmClock size={16} />}
          color={o.followupsDue > 0 ? 'var(--danger)' : 'var(--muted-dot)'}
          index={3}
        />
      </div>

      <div className="toolbar" style={{ marginTop: 18 }}>
        <div className="filters">
          <span className="search">
            <Search size={14} />
            <input
              className="input"
              placeholder="Search company, person or profile"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </span>
          <select
            className="select select--inline"
            value={status}
            onChange={(e) => setStatus(e.target.value as ContactStatus | 'All')}
          >
            <option value="All">All statuses</option>
            {CONTACT_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="row" style={{ gap: 12 }}>
          <span className="muted">{rows.length} shown</span>
          <Button variant="primary" onClick={openNew}>
            <Plus size={14} /> Add contact
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Users size={19} />}
          title="Nothing matches"
          text="Try another status, or clear the search."
        />
      ) : (
        <AnimatedSection>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Company / target</th>
                  <th className="tight">Type</th>
                  <th className="tight">Status</th>
                  <th className="tight">Sent</th>
                  <th className="tight">Follow-up</th>
                  <th>Angle</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const overdue = c.followup !== '' && c.followup <= today;
                  return (
                    <tr key={c.id}>
                      <td>
                        <div className="cell-strong">
                          {c.company}
                          {c.searchUrl && (
                            <a
                              href={c.searchUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ marginLeft: 6, verticalAlign: 'middle' }}
                              aria-label="Find people on LinkedIn"
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                        <div className="cell-sub">{c.person || c.targetProfile}</div>
                      </td>
                      <td className="tight">
                        <span className="muted">{c.contactType}</span>
                      </td>
                      <td className="tight">
                        <StatusSelect
                          value={c.status}
                          options={CONTACT_STATUSES}
                          onChange={(next) => {
                            const patch: Partial<Contact> = { status: next };
                            if (next === 'Sent' && !c.dateSent) patch.dateSent = today;
                            update('contacts', c.id, patch);
                          }}
                          variant={contactVariant[c.status]}
                          icon={contactIcon[c.status]}
                          ariaLabel={`Status for ${c.person || c.company}`}
                        />
                      </td>
                      <td className="tight">{c.dateSent ? fmtShort(c.dateSent) : '—'}</td>
                      <td className="tight">
                        {c.followup ? (
                          overdue ? (
                            <Badge variant="error" dot>
                              <AlarmClock size={11} /> {fmtShort(c.followup)}
                            </Badge>
                          ) : (
                            fmtShort(c.followup)
                          )
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <div className="cell-sub">{c.angle}</div>
                      </td>
                      <td className="tight">
                        <div className="row-actions">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(c)} aria-label="Edit">
                            <Pencil size={13} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`Delete this ${c.company} contact?`)) remove('contacts', c.id);
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
        title={editing ? `${editing.company} — ${editing.person || editing.targetProfile}` : 'Add contact'}
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
                    remove('contacts', editing.id);
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
                list="net-company-list"
                value={draft.company}
                onChange={(e) => setDraft({ ...draft, company: e.target.value })}
              />
              <datalist id="net-company-list">
                {companies.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </Field>
            <Field label="Person" hint="Blank until you've identified a real human.">
              <input
                className="input"
                value={draft.person}
                onChange={(e) => setDraft({ ...draft, person: e.target.value })}
              />
            </Field>
            <Field label="Target profile" full>
              <input
                className="input"
                value={draft.targetProfile}
                onChange={(e) => setDraft({ ...draft, targetProfile: e.target.value })}
                placeholder="Technical Support / Solutions Engineer"
              />
            </Field>
            <Field label="Contact type">
              <select
                className="select"
                value={draft.contactType}
                onChange={(e) => setDraft({ ...draft, contactType: e.target.value as ContactType })}
              >
                {CONTACT_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <StatusSelect
                block
                value={draft.status}
                options={CONTACT_STATUSES}
                onChange={(v) => setDraft({ ...draft, status: v })}
                variant={contactVariant[draft.status]}
                icon={contactIcon[draft.status]}
              />
            </Field>
            <Field label="People-search URL" full>
              <input
                className="input"
                value={draft.searchUrl}
                onChange={(e) => setDraft({ ...draft, searchUrl: e.target.value })}
              />
            </Field>
            <Field label="Profile link" full>
              <input
                className="input"
                value={draft.link}
                onChange={(e) => setDraft({ ...draft, link: e.target.value })}
              />
            </Field>
            <Field label="Date sent">
              <input
                className="input"
                type="date"
                value={draft.dateSent}
                onChange={(e) => setDraft({ ...draft, dateSent: e.target.value })}
              />
            </Field>
            <Field label="Follow-up">
              <input
                className="input"
                type="date"
                value={draft.followup}
                onChange={(e) => setDraft({ ...draft, followup: e.target.value })}
              />
            </Field>
            <Field label="Meeting">
              <input
                className="input"
                type="date"
                value={draft.meeting}
                onChange={(e) => setDraft({ ...draft, meeting: e.target.value })}
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
            <Field label="Message angle" full hint="The specific reason you're writing to this person.">
              <textarea
                className="textarea"
                value={draft.angle}
                onChange={(e) => setDraft({ ...draft, angle: e.target.value })}
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

export default NetworkingPage;
