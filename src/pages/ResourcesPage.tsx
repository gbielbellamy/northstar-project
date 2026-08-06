import { useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Hammer,
  Pencil,
  Plus,
  Target,
  Trash2,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { priorityIcon, priorityVariant } from '../lib/ui';
import {
  PRIORITIES,
  RESOURCE_KINDS,
  SKILL_CATEGORIES,
  type MessageTemplate,
  type ResourceKind,
  type Skill,
  type SkillCategory,
  type SkillSession,
} from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Field from '../components/ui/Field';
import Checkbox from '../components/ui/Checkbox';
import ProgressBar from '../components/ui/ProgressBar';
import StatusSelect from '../components/ui/StatusSelect';
import SkillIcon from '../components/ui/SkillIcon';
import EmptyState from '../components/ui/EmptyState';
import Toast from '../components/ui/Toast';
import AnimatedSection from '../components/ui/AnimatedSection';

const BLANK_SKILL: Omit<Skill, 'id'> = {
  skill: '',
  currentLevel: '',
  target: '',
  priority: 'Medium',
  evidence: '',
  action: '',
  why: '',
  miniProject: '',
  miniProjectDod: '',
  resources: [],
  sessions: [],
  category: 'Foundations',
  badge: '',
  colour: '#8b5cf6',
  icon: '',
  optional: false,
};

const BLANK_TPL: Omit<MessageTemplate, 'id'> = { useCase: '', template: '' };

/** Ids for nested rows, which the store's generic add() never sees. */
function rowId(prefix: string) {
  const rnd =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rnd}`;
}

function ResourcesPage() {
  const { skills, templates } = useStore();
  const add = useStore((s) => s.add);
  const update = useStore((s) => s.update);
  const remove = useStore((s) => s.remove);

  const [openSkill, setOpenSkill] = useState<string | null>(null);
  const [skillEdit, setSkillEdit] = useState<Skill | null>(null);
  const [skillDraft, setSkillDraft] = useState<Omit<Skill, 'id'> | null>(null);
  const [tplEdit, setTplEdit] = useState<MessageTemplate | null>(null);
  const [tplDraft, setTplDraft] = useState<Omit<MessageTemplate, 'id'> | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  /** Grouped in the order SKILL_CATEGORIES declares, so the page reads as a path. */
  const byCategory = useMemo(() => {
    const map = new Map<SkillCategory, Skill[]>();
    for (const s of skills) {
      const key = SKILL_CATEGORIES.includes(s.category) ? s.category : 'Foundations';
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return SKILL_CATEGORIES.filter((c) => map.has(c)).map(
      (c) => [c, map.get(c)!] as [SkillCategory, Skill[]],
    );
  }, [skills]);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      flash('Copied — now change a sentence');
    } catch {
      // Clipboard API needs a secure context; fall back to the old trick.
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      flash('Copied — now change a sentence');
    }
  }

  function saveSkill() {
    if (!skillDraft) return;
    if (!skillDraft.skill.trim()) return alert('Give the skill a name.');
    if (skillEdit) update('skills', skillEdit.id, skillDraft);
    else add('skills', skillDraft);
    setSkillDraft(null);
    setSkillEdit(null);
  }

  function saveTpl() {
    if (!tplDraft) return;
    if (!tplDraft.useCase.trim()) return alert('Give the template a use case.');
    if (tplEdit) update('templates', tplEdit.id, tplDraft);
    else add('templates', tplDraft);
    setTplDraft(null);
    setTplEdit(null);
  }

  /** Ticking a session writes straight through — no modal for a one-click action. */
  function toggleSession(skill: Skill, sessionId: string, done: boolean) {
    update('skills', skill.id, {
      sessions: skill.sessions.map((s) => (s.id === sessionId ? { ...s, done } : s)),
    });
  }

  return (
    <div className="page">
      <div className="page__head">
        <h1>Resources</h1>
        <p className="page__sub">
          Skills and outreach templates. Each skill carries links, a mini project, and sessions sized to fit
          one Learning block.
        </p>
      </div>

      <div className="section">
        <h2>Skills roadmap</h2>
        <Button
          onClick={() => {
            setSkillEdit(null);
            setSkillDraft(BLANK_SKILL);
          }}
        >
          <Plus size={14} /> Add skill
        </Button>
      </div>

      {skills.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={19} />}
          title="No skills tracked"
          text="Add the gaps you know about. The evidence column is what turns a claim into a fact."
        />
      ) : (
        <div className="stack">
          {byCategory.map(([category, group]) => (
            <div key={category} className="skill-group">
              <div className="skill-group__head">
                <h3>{category}</h3>
                <span className="muted">
                  {group.length} {group.length === 1 ? 'skill' : 'skills'} ·{' '}
                  {group.reduce((n, s) => n + s.sessions.filter((x) => x.done).length, 0)}/
                  {group.reduce((n, s) => n + s.sessions.length, 0)} sessions
                </span>
              </div>
              <div className="stack">
          {group.map((s, i) => {
            const isOpen = openSkill === s.id;
            const doneCount = s.sessions.filter((x) => x.done).length;
            const pct = s.sessions.length ? Math.round((doneCount / s.sessions.length) * 100) : 0;
            const ordered = [...s.sessions].sort((a, b) => a.order - b.order);

            return (
              <AnimatedSection key={s.id} delay={i * 0.02}>
                <Card className="card--hover">
                  <div className="toolbar" style={{ marginBottom: 8 }}>
                    <SkillIcon icon={s.icon} badge={s.badge} colour={s.colour} />
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div className="row" style={{ gap: 8, marginBottom: 4 }}>
                        <h3>{s.skill}</h3>
                        {pct === 100 && s.sessions.length > 0 && (
                          <Badge variant="success">Path complete</Badge>
                        )}
                      </div>
                      <p className="muted">
                        {s.currentLevel || '—'} → {s.target || '—'}
                      </p>
                    </div>
                    <div className="row">
                      <StatusSelect
                        value={s.priority}
                        options={PRIORITIES}
                        onChange={(v) => update('skills', s.id, { priority: v })}
                        variant={priorityVariant[s.priority]}
                        icon={priorityIcon[s.priority]}
                        ariaLabel={`Priority for ${s.skill}`}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setSkillEdit(s);
                          const { id: _id, ...rest } = s;
                          void _id;
                          setSkillDraft(rest);
                        }}
                        aria-label={`Edit ${s.skill}`}
                      >
                        <Pencil size={13} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Delete "${s.skill}"?`)) remove('skills', s.id);
                        }}
                        aria-label={`Delete ${s.skill}`}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>

                  {s.sessions.length > 0 && (
                    <div className="row" style={{ gap: 10, alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ flex: 1 }}>
                        <ProgressBar value={pct} />
                      </div>
                      <span className="muted" style={{ minWidth: 110, textAlign: 'right' }}>
                        {pct}% · {doneCount}/{s.sessions.length} sessions
                      </span>
                    </div>
                  )}

                  <Button size="sm" variant="ghost" onClick={() => setOpenSkill(isOpen ? null : s.id)}>
                    {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    {isOpen
                      ? 'Hide the path'
                      : `Show the path — ${s.sessions.length} sessions, ${s.resources.length} resources`}
                  </Button>

                  {isOpen && (
                    <div className="skill-body">
                      {s.why && (
                        <div className="skill-note">
                          <div className="skill-note__label">
                            <Target size={13} /> Why this matters
                          </div>
                          <p>{s.why}</p>
                        </div>
                      )}

                      {s.miniProject && (
                        <div className="skill-note skill-note--project">
                          <div className="skill-note__label">
                            <Hammer size={13} /> Mini-project
                          </div>
                          <p>{s.miniProject}</p>
                          {s.miniProjectDod && (
                            <p className="muted" style={{ marginTop: 6 }}>
                              Done when: {s.miniProjectDod}
                            </p>
                          )}
                        </div>
                      )}

                      {s.resources.length > 0 && (
                        <>
                          <h4 className="skill-h">Resources</h4>
                          <div className="res-list">
                            {RESOURCE_KINDS.filter((k) => s.resources.some((r) => r.kind === k)).map(
                              (kind) => (
                                <div key={kind} className="res-group">
                                  <Badge variant="muted">{kind}</Badge>
                                  {s.resources
                                    .filter((r) => r.kind === kind)
                                    .map((r) => (
                                      <div key={r.id} className="res-item">
                                        <a href={r.url} target="_blank" rel="noreferrer">
                                          {r.title} <ExternalLink size={11} />
                                        </a>
                                        {r.note && <p className="cell-sub">{r.note}</p>}
                                      </div>
                                    ))}
                                </div>
                              ),
                            )}
                          </div>
                        </>
                      )}

                      {ordered.length > 0 && (
                        <>
                          <h4 className="skill-h">Sessions</h4>
                          <div className="stack" style={{ gap: 8 }}>
                            {ordered.map((sess) => (
                              <div
                                key={sess.id}
                                className={`sess ${sess.done ? 'sess--done' : ''}`.trim()}
                              >
                                <Checkbox
                                  checked={sess.done}
                                  onChange={(v) => toggleSession(s, sess.id, v)}
                                  label={`${sess.order}. ${sess.title}`}
                                />
                                <div className="sess__body">
                                  {sess.goal && <p className="sess__goal">{sess.goal}</p>}
                                  {sess.exercise && (
                                    <p className="cell-sub">
                                      <strong>Do:</strong> {sess.exercise}
                                    </p>
                                  )}
                                  <div className="row" style={{ gap: 8, marginTop: 5 }}>
                                    <Badge variant="info">{sess.minutes} min</Badge>
                                    {sess.resourceUrl && (
                                      <a href={sess.resourceUrl} target="_blank" rel="noreferrer">
                                        Open resource <ExternalLink size={11} />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {(s.evidence || s.action) && (
                        <>
                          <h4 className="skill-h">Evidence & habit</h4>
                          {s.evidence && (
                            <p className="cell-sub">
                              <strong>Evidence to create:</strong> {s.evidence}
                            </p>
                          )}
                          {s.action && (
                            <p className="cell-sub">
                              <strong>Working rule:</strong> {s.action}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </Card>
              </AnimatedSection>
            );
          })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="section">
        <h2>Message templates</h2>
        <Button
          onClick={() => {
            setTplEdit(null);
            setTplDraft(BLANK_TPL);
          }}
        >
          <Plus size={14} /> Add template
        </Button>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon={<Copy size={19} />}
          title="No templates"
          text="Write the message you'd actually send, once. Then reuse the skeleton and change the specifics."
        />
      ) : (
        <div className="tpl-grid">
          {templates.map((t, i) => (
            <AnimatedSection key={t.id} delay={i * 0.03}>
              <Card className="card--hover">
                <div className="tpl__head">
                  <strong style={{ color: 'var(--text-h)', fontSize: 13 }}>{t.useCase}</strong>
                  <div className="row" style={{ gap: 2 }}>
                    <Button size="icon" variant="ghost" onClick={() => copy(t.template)} aria-label="Copy">
                      <Copy size={13} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setTplEdit(t);
                        const { id: _id, ...rest } = t;
                        void _id;
                        setTplDraft(rest);
                      }}
                      aria-label="Edit template"
                    >
                      <Pencil size={13} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Delete "${t.useCase}"?`)) remove('templates', t.id);
                      }}
                      aria-label="Delete template"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
                <p className="tpl__text">{t.template}</p>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      )}

      {/* ---------- Skill modal ---------- */}
      <Modal
        open={skillDraft !== null}
        title={skillEdit ? `Edit ${skillEdit.skill}` : 'Add skill'}
        subtitle="Give it something to build and something to read."
        onClose={() => {
          setSkillDraft(null);
          setSkillEdit(null);
        }}
        actions={
          <>
            <Button
              onClick={() => {
                setSkillDraft(null);
                setSkillEdit(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={saveSkill}>
              <Check size={14} /> Save
            </Button>
          </>
        }
      >
        {skillDraft && (
          <div className="form-grid">
            <Field label="Skill">
              <input
                className="input"
                value={skillDraft.skill}
                onChange={(e) => setSkillDraft({ ...skillDraft, skill: e.target.value })}
              />
            </Field>
            <Field label="Priority">
              <StatusSelect
                block
                value={skillDraft.priority}
                options={PRIORITIES}
                onChange={(v) => setSkillDraft({ ...skillDraft, priority: v })}
                variant={priorityVariant[skillDraft.priority]}
                icon={priorityIcon[skillDraft.priority]}
              />
            </Field>
            <Field label="Category">
              <select
                className="select"
                value={skillDraft.category}
                onChange={(e) =>
                  setSkillDraft({ ...skillDraft, category: e.target.value as SkillCategory })
                }
              >
                {SKILL_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field
              label="Logo slug"
              hint="simple-icons name, e.g. typescript. Leave blank to use the letters."
            >
              <input
                className="input"
                value={skillDraft.icon}
                onChange={(e) =>
                  setSkillDraft({ ...skillDraft, icon: e.target.value.trim().toLowerCase() })
                }
              />
            </Field>
            <Field label="Badge" hint="One or two letters, used when there's no logo.">
              <input
                className="input"
                maxLength={2}
                value={skillDraft.badge}
                onChange={(e) =>
                  setSkillDraft({ ...skillDraft, badge: e.target.value.toUpperCase() })
                }
              />
            </Field>
            <Field label="Badge colour">
              <input
                className="input"
                type="color"
                value={skillDraft.colour}
                onChange={(e) => setSkillDraft({ ...skillDraft, colour: e.target.value })}
              />
            </Field>
            <Field label="Current level">
              <input
                className="input"
                value={skillDraft.currentLevel}
                onChange={(e) => setSkillDraft({ ...skillDraft, currentLevel: e.target.value })}
              />
            </Field>
            <Field label="Target">
              <input
                className="input"
                value={skillDraft.target}
                onChange={(e) => setSkillDraft({ ...skillDraft, target: e.target.value })}
              />
            </Field>
            <Field label="Why this matters" full hint="For the job hunt specifically, not in the abstract.">
              <textarea
                className="textarea"
                value={skillDraft.why}
                onChange={(e) => setSkillDraft({ ...skillDraft, why: e.target.value })}
              />
            </Field>
            <Field label="Mini-project" full hint="The thing you build to prove it.">
              <textarea
                className="textarea"
                value={skillDraft.miniProject}
                onChange={(e) => setSkillDraft({ ...skillDraft, miniProject: e.target.value })}
              />
            </Field>
            <Field label="Mini-project done when" full>
              <textarea
                className="textarea"
                value={skillDraft.miniProjectDod}
                onChange={(e) => setSkillDraft({ ...skillDraft, miniProjectDod: e.target.value })}
              />
            </Field>
            <Field label="Evidence to create" full hint="What a stranger could look at to believe you.">
              <textarea
                className="textarea"
                value={skillDraft.evidence}
                onChange={(e) => setSkillDraft({ ...skillDraft, evidence: e.target.value })}
              />
            </Field>
            <Field label="Working rule" full>
              <textarea
                className="textarea"
                value={skillDraft.action}
                onChange={(e) => setSkillDraft({ ...skillDraft, action: e.target.value })}
              />
            </Field>

            {/* ----- resources ----- */}
            <div className="full">
              <div className="section" style={{ marginTop: 4 }}>
                <h2 style={{ fontSize: 14 }}>Resources</h2>
                <Button
                  size="sm"
                  onClick={() =>
                    setSkillDraft({
                      ...skillDraft,
                      resources: [
                        ...skillDraft.resources,
                        { id: rowId('sr'), title: '', url: '', kind: 'Docs', note: '' },
                      ],
                    })
                  }
                >
                  <Plus size={13} /> Add resource
                </Button>
              </div>
              {skillDraft.resources.length === 0 && (
                <p className="muted">No links yet. One good one beats five you'll never open.</p>
              )}
              <div className="stack" style={{ gap: 10 }}>
                {skillDraft.resources.map((r, idx) => (
                  <div key={r.id} className="sub-row">
                    <div className="form-grid">
                      <Field label="Title">
                        <input
                          className="input"
                          value={r.title}
                          onChange={(e) => {
                            const next = [...skillDraft.resources];
                            next[idx] = { ...r, title: e.target.value };
                            setSkillDraft({ ...skillDraft, resources: next });
                          }}
                        />
                      </Field>
                      <Field label="Kind">
                        <select
                          className="select"
                          value={r.kind}
                          onChange={(e) => {
                            const next = [...skillDraft.resources];
                            next[idx] = { ...r, kind: e.target.value as ResourceKind };
                            setSkillDraft({ ...skillDraft, resources: next });
                          }}
                        >
                          {RESOURCE_KINDS.map((k) => (
                            <option key={k}>{k}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="URL" full>
                        <input
                          className="input"
                          value={r.url}
                          placeholder="https://"
                          onChange={(e) => {
                            const next = [...skillDraft.resources];
                            next[idx] = { ...r, url: e.target.value };
                            setSkillDraft({ ...skillDraft, resources: next });
                          }}
                        />
                      </Field>
                      <Field label="Why this one" full>
                        <input
                          className="input"
                          value={r.note}
                          onChange={(e) => {
                            const next = [...skillDraft.resources];
                            next[idx] = { ...r, note: e.target.value };
                            setSkillDraft({ ...skillDraft, resources: next });
                          }}
                        />
                      </Field>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Remove resource"
                      onClick={() =>
                        setSkillDraft({
                          ...skillDraft,
                          resources: skillDraft.resources.filter((x) => x.id !== r.id),
                        })
                      }
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* ----- sessions ----- */}
            <div className="full">
              <div className="section" style={{ marginTop: 4 }}>
                <h2 style={{ fontSize: 14 }}>Sessions</h2>
                <Button
                  size="sm"
                  onClick={() =>
                    setSkillDraft({
                      ...skillDraft,
                      sessions: [
                        ...skillDraft.sessions,
                        {
                          id: rowId('ss'),
                          order: skillDraft.sessions.length + 1,
                          title: '',
                          goal: '',
                          exercise: '',
                          resourceUrl: '',
                          minutes: 60,
                          done: false,
                        } satisfies SkillSession,
                      ],
                    })
                  }
                >
                  <Plus size={13} /> Add session
                </Button>
              </div>
              {skillDraft.sessions.length === 0 && (
                <p className="muted">No sessions yet. Break the skill into sittings you can actually do.</p>
              )}
              <div className="stack" style={{ gap: 10 }}>
                {skillDraft.sessions.map((sess, idx) => {
                  const patch = (p: Partial<SkillSession>) => {
                    const next = [...skillDraft.sessions];
                    next[idx] = { ...sess, ...p };
                    setSkillDraft({ ...skillDraft, sessions: next });
                  };
                  return (
                    <div key={sess.id} className="sub-row">
                      <div className="form-grid">
                        <Field label="Order">
                          <input
                            className="input"
                            type="number"
                            min={1}
                            value={sess.order}
                            onChange={(e) => patch({ order: Number(e.target.value) })}
                          />
                        </Field>
                        <Field label="Minutes">
                          <input
                            className="input"
                            type="number"
                            min={0}
                            step={15}
                            value={sess.minutes}
                            onChange={(e) => patch({ minutes: Number(e.target.value) })}
                          />
                        </Field>
                        <Field label="Title" full>
                          <input
                            className="input"
                            value={sess.title}
                            onChange={(e) => patch({ title: e.target.value })}
                          />
                        </Field>
                        <Field label="What you understand afterwards" full>
                          <textarea
                            className="textarea"
                            value={sess.goal}
                            onChange={(e) => patch({ goal: e.target.value })}
                          />
                        </Field>
                        <Field label="What you write yourself" full hint="Reading alone doesn't count.">
                          <textarea
                            className="textarea"
                            value={sess.exercise}
                            onChange={(e) => patch({ exercise: e.target.value })}
                          />
                        </Field>
                        <Field label="Resource URL" full>
                          <input
                            className="input"
                            value={sess.resourceUrl}
                            placeholder="https://"
                            onChange={(e) => patch({ resourceUrl: e.target.value })}
                          />
                        </Field>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Remove session"
                        onClick={() =>
                          setSkillDraft({
                            ...skillDraft,
                            sessions: skillDraft.sessions.filter((x) => x.id !== sess.id),
                          })
                        }
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ---------- Template modal ---------- */}
      <Modal
        open={tplDraft !== null}
        title={tplEdit ? `Edit "${tplEdit.useCase}"` : 'Add template'}
        onClose={() => {
          setTplDraft(null);
          setTplEdit(null);
        }}
        actions={
          <>
            <Button
              onClick={() => {
                setTplDraft(null);
                setTplEdit(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={saveTpl}>
              <Check size={14} /> Save
            </Button>
          </>
        }
      >
        {tplDraft && (
          <div className="form-grid">
            <Field label="Use case" full>
              <input
                className="input"
                value={tplDraft.useCase}
                onChange={(e) => setTplDraft({ ...tplDraft, useCase: e.target.value })}
                placeholder="First message to a peer engineer"
              />
            </Field>
            <Field label="Template" full hint="Use [brackets] for the parts you must replace every time.">
              <textarea
                className="textarea"
                style={{ minHeight: 180 }}
                value={tplDraft.template}
                onChange={(e) => setTplDraft({ ...tplDraft, template: e.target.value })}
              />
            </Field>
          </div>
        )}
      </Modal>

      <Toast message={toast} />
    </div>
  );
}

export default ResourcesPage;
