import { Circle, CircleCheck, Pencil, SkipForward, Trash2, Undo2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { fmtShort } from '../../lib/dates';
import type { ScheduleBlock } from '../../types';
import Button from './Button';

type Props = {
  block: ScheduleBlock;
  /** The day this instance of the block falls on. */
  date: string;
  onEdit: (block: ScheduleBlock) => void;
};

/**
 * Mark done, skip, edit, delete — the controls on one sitting.
 *
 * Shared so the dashboard and the schedule cannot drift apart: they were the
 * same block with different buttons, which is how one of them ends up missing
 * a feature nobody notices for a month.
 */
function BlockActions({ block, date, onEdit }: Props) {
  const dailyLog = useStore((s) => s.dailyLog);
  const deferrals = useStore((s) => s.deferrals);
  const add = useStore((s) => s.add);
  const remove = useStore((s) => s.remove);
  const toggleLog = useStore((s) => s.toggleLog);

  const done = Boolean(dailyLog[date]?.[block.id]);
  const deferral = deferrals.find((d) => d.date === date && d.blockId === block.id);

  return (
    <div className="block__side">
      {deferral ? (
        <div className="skip-note">
          <span className="status-chip status-chip--warning">
            <SkipForward size={13} /> Skipped
          </span>
          <Button size="sm" variant="ghost" onClick={() => remove('deferrals', deferral.id)}>
            <Undo2 size={13} /> Undo
          </Button>
        </div>
      ) : (
        <>
          <button
            type="button"
            className={`day-toggle ${done ? 'day-toggle--on' : ''}`.trim()}
            onClick={() => toggleLog(date, block.id, !done)}
            aria-pressed={done}
            aria-label={`Mark ${block.label} done on ${fmtShort(date)}`}
          >
            {done ? <CircleCheck size={14} /> : <Circle size={14} />}
            {done ? 'Done' : 'Mark done'}
          </button>
          {!done && block.area && (
            <button
              type="button"
              className="day-toggle"
              onClick={() => add('deferrals', { date, blockId: block.id, area: block.area! })}
              title={`Push this to the next ${block.area} session`}
              aria-label={`Skip ${block.label} on ${fmtShort(date)}`}
            >
              <SkipForward size={14} /> Skip
            </button>
          )}
        </>
      )}
      <div className="row" style={{ gap: 2 }}>
        <Button size="icon" variant="ghost" onClick={() => onEdit(block)} aria-label="Edit block">
          <Pencil size={13} />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => {
            if (confirm('Delete this block from every week?')) remove('schedule', block.id);
          }}
          aria-label="Delete block"
        >
          <Trash2 size={13} />
        </Button>
      </div>
    </div>
  );
}

export default BlockActions;
