import { ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { BadgeVariant } from '../../lib/ui';

type Props<T extends string> = {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  variant: BadgeVariant;
  /** Icon for the current value. Use the maps in lib/ui. */
  icon?: LucideIcon;
  /** Turns a raw value into what the user reads, e.g. "A" -> "Tier A". */
  renderLabel?: (value: T) => string;
  ariaLabel?: string;
  /** Stretch to the container's full width. Used in form fields. */
  block?: boolean;
};

/** A native <select> styled as a status badge, so it shows and sets in one place. */
function StatusSelect<T extends string>({
  value,
  options,
  onChange,
  variant,
  icon: Icon,
  renderLabel,
  ariaLabel,
  block = false,
}: Props<T>) {
  const label = renderLabel ?? ((v: T) => v);

  return (
    <span className={`status-select status-select--${variant} ${block ? 'status-select--block' : ''}`.trim()}>
      {Icon ? <Icon size={13} className="status-select__icon" /> : <span className="badge__dot" />}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        aria-label={ariaLabel}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {label(o)}
          </option>
        ))}
      </select>
      <ChevronDown size={12} className="status-select__chevron" aria-hidden />
    </span>
  );
}

export default StatusSelect;
