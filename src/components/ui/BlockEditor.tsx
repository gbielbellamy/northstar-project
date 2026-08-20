import { useEffect, useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { DAY_KEYS, DAY_NAMES } from '../../lib/dates';
import { AREAS, type Area, type DayKey, type ScheduleBlock } from '../../types';
import Modal from './Modal';
import Button from './Button';
import Field from './Field';
import Checkbox from './Checkbox';

const EMPTY: Omit<ScheduleBlock, 'id'> = {
  day: 'Mon',
  start: '09:00',
  end: '10:00',
  area: 'Project',
  label: '',
  optional: false,
};

type Props = {
  /** The block being edited, or null to add a new one. */
  editing: ScheduleBlock | null;
  open: boolean;
  onClose: () => void;
  /** Preselected weekday when adding. */
  day?: DayKey;
};

/**
 * Add or edit one block of the weekly template.
 *
 * Lives here rather than in the schedule page so the dashboard can offer the
 * same thing: a block is editable wherever it appears.
 */
function BlockEditor({ editing, open, onClose, day }: Props) {
  const add = useStore((s) => s.add);
  const update = useStore((s) => s.update);
  const remove = useStore((s) => s.remove);
  const [draft, setDraft] = useState<Omit<ScheduleBlock, 'id'>>(EMPTY);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const { id: _id, ...rest } = editing;
      void _id;
      setDraft(rest);
    } else {
      setDraft({ ...EMPTY, day: day ?? 'Mon' });
    }
  }, [open, editing, day]);

  function save() {
    if (editing) update('schedule', editing.id, draft);
    else add('schedule', draft);
    onClose();
  }

  return (
    <Modal
      open={open}
      title={editing ? 'Edit block' : 'Add block'}
      subtitle="Blocks are the weekly template — a change here applies to this weekday in every week."
      onClose={onClose}
      actions={
        <>
          {editing && (
            <span className="spacer">
              <Button
                variant="danger"
                onClick={() => {
                  remove('schedule', editing.id);
                  onClose();
                }}
              >
                <Trash2 size={14} /> Delete
              </Button>
            </span>
          )}
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>
            <Check size={14} /> Save
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Day">
          <select
            className="select"
            value={draft.day}
            onChange={(e) => setDraft({ ...draft, day: e.target.value as DayKey })}
          >
            {DAY_KEYS.map((d) => (
              <option key={d} value={d}>
                {DAY_NAMES[d]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Area" hint="Leave as Break for lunch or anything not tracked.">
          <select
            className="select"
            value={draft.area ?? ''}
            onChange={(e) => setDraft({ ...draft, area: (e.target.value || null) as Area | null })}
          >
            <option value="">Break / not tracked</option>
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Start">
          <input
            className="input"
            type="time"
            value={draft.start}
            onChange={(e) => setDraft({ ...draft, start: e.target.value })}
          />
        </Field>
        <Field label="End">
          <input
            className="input"
            type="time"
            value={draft.end}
            onChange={(e) => setDraft({ ...draft, end: e.target.value })}
          />
        </Field>
        <Field label="Label" full hint="What you'd call this block on a calendar.">
          <input
            className="input"
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            placeholder="Deep work"
          />
        </Field>
        <Field
          label="Done when"
          full
          hint="What finishing this one sitting looks like. The week's target lives in Roadmap."
        >
          <textarea
            className="textarea"
            value={draft.sessionDone ?? ''}
            onChange={(e) => setDraft({ ...draft, sessionDone: e.target.value })}
            placeholder="One application out, tailored to the role."
          />
        </Field>
        <div className="full">
          <Checkbox
            checked={draft.optional}
            onChange={(v) => setDraft({ ...draft, optional: v })}
            label="Optional — doesn’t count toward the weekly hour budget"
          />
        </div>
      </div>
    </Modal>
  );
}

export default BlockEditor;
