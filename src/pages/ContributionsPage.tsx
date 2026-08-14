import { useMemo, useState } from 'react';
import {
  Check,
  ExternalLink,
  GitBranch,
  GitMerge,
  GitPullRequest,
  GitPullRequestArrow,
  GitPullRequestDraft,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { todayISO } from '../lib/dates';
import { ossKindVariant, ossStageIcon, ossStageVariant } from '../lib/ui';
import {
  OSS_KINDS,
  OSS_STAGES,
  type OssContribution,
  type OssKind,
} from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Field from '../components/ui/Field';
import StatCard from '../components/ui/StatCard';
import StatusSelect from '../components/ui/StatusSelect';
import EmptyState from '../components/ui/EmptyState';
import AnimatedSection from '../components/ui/AnimatedSection';

/** The contribution path, in order. Written as instructions, not theory. */
const STEPS: { title: string; body: string; watch: string }[] = [
  {
    title: '1. Pick projects you actually use',
    body: 'Three, no more. Zustand, Vitest, Prisma, Playwright — things already in your stack, where you understand what the library is for. Contributing to a project you have never run is how people waste a month.',
    watch: 'Avoid huge projects like React or Node. The queue is long and maintainers are overloaded.',
  },
  {
    title: '2. Read CONTRIBUTING.md before anything else',
    body: 'Every project has its own rules: branch naming, commit format, whether they want an issue first, how to run the tests. Read it and write the rules down. Ignoring them is the fastest way to get a PR closed.',
    watch: 'Also check if the project is alive — look at the date of the last merged PR. Under a month is healthy.',
  },
  {
    title: '3. Get it running and the tests green',
    body: 'Clone, install, run the test suite — before you change a single line. If you cannot get a green suite, you cannot tell whether your change broke something. This step alone teaches you more than the contribution.',
    watch: 'Note every setup gotcha as you go. Those notes are often a documentation PR in themselves.',
  },
  {
    title: '4. Find the smallest useful issue',
    body: 'Filter for good-first-issue or help-wanted. A typo, a broken link, a missing test, an unclear error message. Small is the point: you are learning the workflow, not proving you can write a framework.',
    watch: 'Check nobody else has claimed it. Read the comments before you start.',
  },
  {
    title: '5. Claim it, politely',
    body: 'Comment on the issue saying what you intend to do and roughly when. This stops two people doing the same work, and it is what maintainers expect. Wait for a nod on anything non-trivial.',
    watch: 'If nobody answers in a few days, a docs or test fix is usually safe to just open.',
  },
  {
    title: '6. Open the pull request',
    body: 'One change per PR. Follow their commit convention, run their linter and their tests. Write a description with context, what you changed, and how you tested it — the same shape you use on Northstar.',
    watch: 'Link the issue with "Closes #123" so it closes automatically on merge.',
  },
  {
    title: '7. Take the review well',
    body: 'Expect changes to be requested — it is normal and it is the point. Address every comment, push the fixes, thank the reviewer. If you disagree, say so with a reason, not a defence.',
    watch: 'This is the part that mirrors a real job. It is also the part you will be asked about in an interview.',
  },
  {
    title: '8. Record what you learned',
    body: 'Once merged, write down the codebase, what the review taught you, and what you would do differently. That paragraph is worth more in an interview than the merge itself.',
    watch: 'Link the merged PR from your CV. Third-party proof beats anything you can claim about yourself.',
  },
];

const FINDERS = [
  { label: 'Good First Issue', url: 'https://goodfirstissue.dev/', note: 'Filter by language. Start here.' },
  { label: 'First Timers Only', url: 'https://www.firsttimersonly.com/', note: 'How the process works, and why easy issues are reserved.' },
  { label: 'Open Source Guides', url: 'https://opensource.guide/how-to-contribute/', note: "GitHub's own guide. Read the etiquette section." },
  { label: 'GitHub — good-first-issue search', url: 'https://github.com/topics/good-first-issue', note: 'The raw firehose. Use with a language filter.' },
  { label: 'CodeTriage', url: 'https://www.codetriage.org/', note: 'Sends you one open issue a day from a project you choose.' },
];

function blank(today: string): Omit<OssContribution, 'id'> {
  return {
    project: '',
    repoUrl: '',
    title: '',
    kind: 'Docs',
    stage: 'Shortlisted',
    issueUrl: '',
    prUrl: '',
    why: '',
    reviewLesson: '',
    dateStarted: today,
    dateMerged: '',
    notes: '',
  };
}

function ContributionsPage() {
  const { oss, settings } = useStore();
  const add = useStore((s) => s.add);
  const update = useStore((s) => s.update);
  const remove = useStore((s) => s.remove);

  const today = todayISO(settings.todayOverride);
  const [editing, setEditing] = useState<OssContribution | null>(null);
  const [draft, setDraft] = useState<Omit<OssContribution, 'id'> | null>(null);
  const [openSteps, setOpenSteps] = useState(true);

  const stats = useMemo(() => {
    const merged = oss.filter((c) => c.stage === 'Merged').length;
    const open = oss.filter((c) => c.stage === 'PR open' || c.stage === 'Changes requested').length;
    const inProgress = oss.filter((c) =>
      ['Running locally', 'Issue claimed'].includes(c.stage),
    ).length;
    return { merged, open, inProgress, total: oss.length };
  }, [oss]);

  function openNew() {
    setEditing(null);
    setDraft(blank(today));
  }

  function save() {
    if (!draft) return;
    if (!draft.project.trim()) {
      alert('Which project is this for?');
      return;
    }
    const patch = { ...draft };
    // Fill in the merge date rather than asking for it.
    if (patch.stage === 'Merged' && !patch.dateMerged) patch.dateMerged = today;
    if (editing) update('oss', editing.id, patch);
    else add('oss', patch);
    setDraft(null);
    setEditing(null);
  }

  return (
    <div className="page">
      <div className="page__head">
        <div className="toolbar">
          <div>
            <h1>Contributions</h1>
            <p className="page__sub">
              Open source contributions, from shortlisting a project to getting the pull request merged.
              Documentation and test fixes count.
            </p>
          </div>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <StatCard
          label="Merged"
          value={stats.merged}
          desc="The number that counts"
          icon={<GitMerge size={16} />}
          progress={(stats.merged / 3) * 100}
          targetLabel={`${stats.merged} / 3 target`}
        />
        <StatCard
          label="Open PRs"
          value={stats.open}
          desc="Waiting on a maintainer, or on you"
          icon={<GitPullRequestArrow size={16} />}
          color="var(--info)"
          index={1}
        />
        <StatCard
          label="In progress"
          value={stats.inProgress}
          desc="Running locally or issue claimed"
          icon={<GitPullRequestDraft size={16} />}
          color="var(--warn)"
          index={2}
        />
        <StatCard
          label="Tracked"
          value={stats.total}
          desc="Everything you've looked at"
          icon={<GitBranch size={16} />}
          color="var(--area-opensource)"
          index={3}
        />
      </div>

      <div className="section">
        <h2>How to do it</h2>
        <Button size="sm" variant="ghost" onClick={() => setOpenSteps((v) => !v)}>
          {openSteps ? 'Hide the steps' : 'Show the steps'}
        </Button>
      </div>

      {openSteps && (
        <AnimatedSection>
          <div className="steps">
            {STEPS.map((s, i) => (
              <Card key={s.title} className="step card--hover">
                <div className="step__n">{i + 1}</div>
                <div>
                  <div className="step__title">{s.title.replace(/^\d+\.\s*/, '')}</div>
                  <p className="step__body">{s.body}</p>
                  <p className="step__watch">⚠ {s.watch}</p>
                </div>
              </Card>
            ))}
          </div>

          <Card className="finders-card">
            <div className="card__title">Where to look</div>
            <div className="finders">
              {FINDERS.map((f) => (
                <div key={f.url} className="finder">
                  <a href={f.url} target="_blank" rel="noreferrer">
                    {f.label} <ExternalLink size={11} />
                  </a>
                  <p className="cell-sub">{f.note}</p>
                </div>
              ))}
            </div>
          </Card>
        </AnimatedSection>
      )}

      <div className="section">
        <h2>Your contributions</h2>
        <div className="row" style={{ gap: 12 }}>
          <span className="muted">{oss.length} tracked</span>
          <Button variant="primary" onClick={openNew}>
            <Plus size={14} /> Track a contribution
          </Button>
        </div>
      </div>

      {oss.length === 0 ? (
        <EmptyState
          icon={<GitPullRequest size={19} />}
          title="Nothing tracked yet"
          text="From week 5 this gets an hour and a quarter every Tuesday. Start by shortlisting three projects you already use."
        />
      ) : (
        <AnimatedSection>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>What</th>
                  <th className="tight">Kind</th>
                  <th className="tight">Stage</th>
                  <th className="tight">Links</th>
                  <th>What the review taught you</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {oss.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="cell-strong">
                        {c.repoUrl ? (
                          <a href={c.repoUrl} target="_blank" rel="noreferrer">
                            {c.project} <ExternalLink size={11} />
                          </a>
                        ) : (
                          c.project
                        )}
                      </div>
                      <div className="cell-sub">{c.dateMerged || c.dateStarted}</div>
                    </td>
                    <td>
                      <div className="cell-strong">{c.title || '—'}</div>
                      <div className="cell-sub">{c.why}</div>
                    </td>
                    <td className="tight">
                      <Badge variant={ossKindVariant[c.kind]}>{c.kind}</Badge>
                    </td>
                    <td className="tight">
                      <StatusSelect
                        value={c.stage}
                        options={OSS_STAGES}
                        onChange={(next) => {
                          const patch: Partial<OssContribution> = { stage: next };
                          if (next === 'Merged' && !c.dateMerged) patch.dateMerged = today;
                          update('oss', c.id, patch);
                        }}
                        variant={ossStageVariant[c.stage]}
                        icon={ossStageIcon[c.stage]}
                        ariaLabel={`Stage for ${c.project}`}
                      />
                    </td>
                    <td className="tight">
                      <div className="row" style={{ gap: 8 }}>
                        {c.issueUrl && (
                          <a href={c.issueUrl} target="_blank" rel="noreferrer" title="Issue">
                            Issue
                          </a>
                        )}
                        {c.prUrl && (
                          <a href={c.prUrl} target="_blank" rel="noreferrer" title="Pull request">
                            PR
                          </a>
                        )}
                        {!c.issueUrl && !c.prUrl && '—'}
                      </div>
                    </td>
                    <td>
                      <div className="cell-sub">{c.reviewLesson || c.notes || '—'}</div>
                    </td>
                    <td className="tight">
                      <div className="row-actions">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditing(c);
                            const { id: _id, ...rest } = c;
                            void _id;
                            setDraft(rest);
                          }}
                          aria-label="Edit"
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Stop tracking ${c.project}?`)) remove('oss', c.id);
                          }}
                          aria-label="Delete"
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

      <Modal
        open={draft !== null}
        title={editing ? `Edit ${editing.project}` : 'Track a contribution'}
        subtitle="Documentation and tests count, and they are the realistic way in."
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
            <Field label="Project" hint="Something already in your stack.">
              <input
                className="input"
                value={draft.project}
                onChange={(e) => setDraft({ ...draft, project: e.target.value })}
                placeholder="Zustand"
              />
            </Field>
            <Field label="Kind">
              <select
                className="select"
                value={draft.kind}
                onChange={(e) => setDraft({ ...draft, kind: e.target.value as OssKind })}
              >
                {OSS_KINDS.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </Field>
            <Field label="Repository URL" full>
              <input
                className="input"
                value={draft.repoUrl}
                onChange={(e) => setDraft({ ...draft, repoUrl: e.target.value })}
                placeholder="https://github.com/..."
              />
            </Field>
            <Field label="What the change is" full hint="One line, the way you'd title the PR.">
              <input
                className="input"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </Field>
            <Field label="Stage">
              <StatusSelect
                block
                value={draft.stage}
                options={OSS_STAGES}
                onChange={(v) => setDraft({ ...draft, stage: v })}
                variant={ossStageVariant[draft.stage]}
                icon={ossStageIcon[draft.stage]}
              />
            </Field>
            <Field label="Started">
              <input
                className="input"
                type="date"
                value={draft.dateStarted}
                onChange={(e) => setDraft({ ...draft, dateStarted: e.target.value })}
              />
            </Field>
            <Field label="Issue URL">
              <input
                className="input"
                value={draft.issueUrl}
                onChange={(e) => setDraft({ ...draft, issueUrl: e.target.value })}
              />
            </Field>
            <Field label="Pull request URL">
              <input
                className="input"
                value={draft.prUrl}
                onChange={(e) => setDraft({ ...draft, prUrl: e.target.value })}
              />
            </Field>
            <Field label="Why this one" full hint="An interviewer will ask. Have a real answer.">
              <textarea
                className="textarea"
                value={draft.why}
                onChange={(e) => setDraft({ ...draft, why: e.target.value })}
              />
            </Field>
            <Field
              label="What the review taught you"
              full
              hint="The most valuable thing on this page. Fill it in once the feedback lands."
            >
              <textarea
                className="textarea"
                value={draft.reviewLesson}
                onChange={(e) => setDraft({ ...draft, reviewLesson: e.target.value })}
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

export default ContributionsPage;
