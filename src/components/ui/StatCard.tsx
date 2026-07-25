import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

type Props = {
  label: string;
  value: string | number;
  desc?: string;
  icon: ReactNode;
  /** The card's own hue, used when there is no target to grade against. */
  color?: string;
  index?: number;
  /** Progress toward the target, 0–100. Omit for cards that aren't graded. */
  progress?: number;
  /** Shown under the bar, e.g. "3 / 10 this week". */
  targetLabel?: string;
  /** Red rather than green as the number climbs — for follow-ups due. */
  invert?: boolean;
  onEditTarget?: () => void;
};

/**
 * Cold to warm to done, so a glance tells you where you are without reading
 * the number. Inverted cards run the other way: rising is bad.
 */
function gradeColour(pct: number, invert: boolean): string {
  if (invert) {
    if (pct <= 0) return 'var(--ok)';
    if (pct < 50) return 'var(--warn)';
    return 'var(--danger)';
  }
  if (pct >= 100) return 'var(--ok)';
  if (pct >= 60) return 'var(--area-portfolio)';
  if (pct >= 30) return 'var(--warn)';
  return 'var(--danger)';
}

function StatCard({
  label,
  value,
  desc,
  icon,
  color = 'var(--accent)',
  index = 0,
  progress,
  targetLabel,
  invert = false,
  onEditTarget,
}: Props) {
  const graded = progress !== undefined;
  const pct = Math.max(0, Math.min(100, progress ?? 0));
  const hue = graded ? gradeColour(pct, invert) : color;

  return (
    <motion.div
      className={`card card--hover stat ${graded ? 'stat--graded' : ''}`.trim()}
      style={{ ['--stat' as string]: hue }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: 'easeOut' }}
    >
      <div className="stat__top">
        <span className="stat__label">{label}</span>
        <span className="stat__icon">{icon}</span>
      </div>
      <div className="stat__value">{value}</div>
      {desc && <div className="stat__desc">{desc}</div>}

      {graded && (
        <div className="stat__goal">
          <div className="stat__bar">
            <motion.div
              className="stat__bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <div className="stat__goal-row">
            <span>{targetLabel}</span>
            {onEditTarget && (
              <button type="button" className="stat__edit" onClick={onEditTarget}>
                Edit target
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default StatCard;
