import { useState } from 'react';
import { BookOpen, Check, Copy, Pencil, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { priorityVariant } from '../lib/ui';
import { PRIORITIES, type MessageTemplate, type Priority, type Skill } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Field from '../components/ui/Field';
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
};

const BLANK_TPL: Omit<MessageTemplate, 'id'> = { useCase: '', template: '' };

function ResourcesPage() {
  const { skills, templates } = useStore();
  const add = useStore((s) => s.add);
  const update = useStore((s) => s.update);
  const remove = useStore((s) => s.remove);

  const [skillEdit, setSkillEdit] = useState<Skill | null>(null);
  const [skillDraft, setSkillDraft] = useState<Omit<Skill, 'id'> | null>(null);
  const [tplEdit, setTplEdit] = useState<MessageTemplate | null>(null);
  const [tplDraft, setTplDraft] = useState<Omit<MessageTemplate, 'id'> | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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

  return (
    <div className="page">
      <div className="page__head">
        <h1>Resources</h1>
        <p className="page__sub">
          The skills you're closing the gap on, and the messages you send while you close it. Both are yours to
          edit — the templates especially. A template you haven't rewritten is a template that reads like one.
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
        <AnimatedSection>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Skill</th>
                  <th className="tight">Now</th>
                  <th className="tight">Target</th>
                  <th className="tight">Priority</th>
                  <th>Evidence to create</th>
                  <th>Action</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {skills.map((s) => (
                  <tr key={s.id}>
                    <td className="cell-strong">{s.skill}</td>
                    <td className="tight">{s.currentLevel}</td>
                    <td className="tight">{s.target}</td>
                    <td className="tight">
                      <Badge variant={priorityVariant[s.priority]}>{s.priority}</Badge>
                    </td>
                    <td>
                      <div className="cell-sub">{s.evidence}</div>
                    </td>
                    <td>
                      <div className="cell-sub">{s.action}</div>
                    </td>
                    <td className="tight">
                      <div className="row-actions">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSkillEdit(s);
                            const { id: _id, ...rest } = s;
                            void _id;
                            setSkillDraft(rest);
                          }}
                          aria-label="Edit skill"
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Delete "${s.skill}"?`)) remove('skills', s.id);
                          }}
                          aria-label="Delete skill"
                        >
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

      <Modal
        open={skillDraft !== null}
        title={skillEdit ? `Edit ${skillEdit.skill}` : 'Add skill'}
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
              <select
                className="select"
                value={skillDraft.priority}
                onChange={(e) => setSkillDraft({ ...skillDraft, priority: e.target.value as Priority })}
              >
                {PRIORITIES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
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
            <Field label="Evidence to create" full hint="What a stranger could look at to believe you.">
              <textarea
                className="textarea"
                value={skillDraft.evidence}
                onChange={(e) => setSkillDraft({ ...skillDraft, evidence: e.target.value })}
              />
            </Field>
            <Field label="Recommended action" full>
              <textarea
                className="textarea"
                value={skillDraft.action}
                onChange={(e) => setSkillDraft({ ...skillDraft, action: e.target.value })}
              />
            </Field>
          </div>
        )}
      </Modal>

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
