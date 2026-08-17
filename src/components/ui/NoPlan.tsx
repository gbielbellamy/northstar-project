import { useState } from 'react';
import { Loader2, Route } from 'lucide-react';
import { useStore } from '../../store/useStore';
import Button from './Button';
import EmptyState from './EmptyState';

/**
 * Shown on the pages that are meaningless without a plan.
 *
 * An account created with "start empty" has no roadmap and no timetable, and
 * these screens had nothing to say about it — the schedule simply read "No
 * week selected", which is a dead end rather than an explanation.
 */
function NoPlan({ what }: { what: string }) {
  const addStandardPlan = useStore((s) => s.addStandardPlan);
  const [busy, setBusy] = useState(false);

  return (
    <div className="page">
      <EmptyState
        icon={<Route size={19} />}
        title={`No plan yet, so there is no ${what}`}
        text="You created this account without one. Load the starter plan and edit it from there, or build your own week by week."
      />
      <div className="row" style={{ justifyContent: 'center', marginTop: 14 }}>
        <Button
          variant="primary"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void addStandardPlan().finally(() => setBusy(false));
          }}
        >
          {busy ? <Loader2 size={14} className="spin" /> : <Route size={14} />}
          Load the starter plan
        </Button>
      </div>
    </div>
  );
}

export default NoPlan;
