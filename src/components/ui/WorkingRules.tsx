import { useState } from 'react';
import { ChevronDown, ChevronRight, ClipboardList } from 'lucide-react';
import Card from './Card';
import Button from './Button';

type Step = {
  title: string;
  body: string;
  commands?: string[];
  where?: string;
};

const STEPS: Step[] = [
  {
    title: 'Open the issue before you start',
    where: 'Issues → New issue',
    body: 'Title it as the outcome, not the topic. Put the block\'s "Done when" in the body and add it to the week\'s milestone.',
    commands: [
      'gh issue create --title "feat(api): applications CRUD routes" \\',
      '  --body "Done when: a clean database can be driven through the API." \\',
      '  --assignee @me --milestone "Week 1"',
    ],
  },
  {
    title: 'Branch off main',
    body: 'One branch per issue, named type/short-description.',
    commands: ['git switch main && git pull', 'git switch -c feat/applications-crud'],
  },
  {
    title: 'Commit as you go, in Conventional Commits',
    body: 'type(scope): description, in the imperative. Small commits that each do one thing, referencing the issue.',
    commands: [
      'git commit -m "feat(api): add applications CRUD routes" -m "Refs #12"',
      'git commit -m "test(api): cover the not-found path"',
      'git commit -m "docs(readme): document the seed script"',
    ],
  },
  {
    title: 'Push and open the pull request',
    body: 'Three headings in the description: Context, Approach, Testing. Close the issue from the PR.',
    commands: [
      'git push -u origin feat/applications-crud',
      'gh pr create --title "feat(api): applications CRUD routes" \\',
      '  --body "## Context\\n...\\n## Approach\\n...\\n## Testing\\n...\\n\\nCloses #12"',
    ],
  },
  {
    title: 'Review your own pull request',
    where: 'The Files changed tab',
    body: 'Read the diff as if a stranger wrote it, then squash-merge and delete the branch.',
    commands: ['gh pr merge --squash --delete-branch'],
  },
  {
    title: 'Record the evidence before you mark it done',
    where: 'Roadmap → the goal → Evidence URL',
    body: 'Paste the PR or commit URL into the goal. Applications go in Applications, contributions in Contributions.',
  },
  {
    title: 'Only then tick the block',
    where: 'Schedule → the block → Mark done',
    body: 'The tick is the last step. No evidence recorded, no block done.',
  },
];

function WorkingRules() {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <div className="toolbar" style={{ marginBottom: open ? 12 : 0 }}>
        <div className="row" style={{ gap: 8 }}>
          <ClipboardList size={15} />
          <strong style={{ color: 'var(--text-h)', fontSize: 13 }}>
            Working rule — issue first, evidence before done
          </strong>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          {open ? 'Hide the steps' : 'How to do it'}
        </Button>
      </div>

      {open && (
        <ol className="rules">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rule">
              <span className="rule__n">{i + 1}</span>
              <div className="rule__body">
                <div className="rule__title">{s.title}</div>
                {s.where && <div className="rule__where">{s.where}</div>}
                <p className="rule__text">{s.body}</p>
                {s.commands && (
                  <pre className="rule__cmd">
                    {s.commands.join('\n')}
                  </pre>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

export default WorkingRules;
