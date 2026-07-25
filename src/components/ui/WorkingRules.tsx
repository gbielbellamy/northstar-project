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

/**
 * The working rule, spelled out. It used to be one long sentence repeated on
 * all ten weeks; nobody follows a rule they can't act on, so here it is as
 * steps with the actual commands.
 */
const STEPS: Step[] = [
  {
    title: 'Open the issue before you start',
    where: 'github.com/<your-user>/northstar → Issues → New issue',
    body: 'Title it as the outcome of the block, not the topic — "Add applications CRUD routes", not "backend work". Put the block\'s "Done when" in the body, assign it to yourself, and add it to the week\'s milestone. The issue is what turns a vague afternoon into a finishable task.',
    commands: [
      'gh issue create --title "feat(api): applications CRUD routes" \\',
      '  --body "Done when: a clean database can be driven through the API." \\',
      '  --assignee @me --milestone "Week 1"',
    ],
  },
  {
    title: 'Branch off main',
    body: 'Never commit straight to main, even alone. A branch per issue is what makes the pull request possible, and the pull request is what a hiring manager reads. Name it type/short-description.',
    commands: [
      'git switch main && git pull',
      'git switch -c feat/applications-crud',
    ],
  },
  {
    title: 'Commit as you go, in Conventional Commits',
    body: 'Format is type(scope): description, in the imperative. Types: feat, fix, docs, refactor, test, chore. Small commits that each do one thing — a reviewer should be able to read them like a story. Reference the issue so GitHub links them.',
    commands: [
      'git commit -m "feat(api): add applications CRUD routes" -m "Refs #12"',
      'git commit -m "test(api): cover the not-found path"',
      'git commit -m "docs(readme): document the seed script"',
    ],
  },
  {
    title: 'Push and open the pull request',
    where: 'GitHub shows a "Compare & pull request" banner after the first push',
    body: 'The description is the part that matters. Three headings: Context (why), Approach (what you did and what you rejected), Testing (how you know it works). Close the issue from the PR so the history joins up.',
    commands: [
      'git push -u origin feat/applications-crud',
      'gh pr create --title "feat(api): applications CRUD routes" \\',
      '  --body "## Context\\n...\\n## Approach\\n...\\n## Testing\\n...\\n\\nCloses #12"',
    ],
  },
  {
    title: 'Review your own pull request',
    where: 'The Files changed tab',
    body: 'Read the diff on GitHub as if a stranger wrote it — you will catch leftover console.logs, commented-out code and bad names every time. Then squash-merge and delete the branch.',
    commands: ['gh pr merge --squash --delete-branch'],
  },
  {
    title: 'Record the evidence before you mark it done',
    where: 'Roadmap → the goal → Evidence URL',
    body: 'Paste the PR or commit URL into the goal. Applications go in the Applications tab the moment they go out; messages go in Networking; a contribution goes in Contributions. The log is only honest if it is written at the time.',
  },
  {
    title: 'Only then tick the block',
    where: 'Schedule → the block → Mark done',
    body: 'The tick is the last step, not the first. If the evidence is not recorded, the block is not done — that rule is the whole point, because it is what stops a busy week from leaving no trace.',
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
